import { jwtConfig } from '@/config';
import { UserEntity } from '@/modules/users/domain/entities';
import { JwtTempTokenType } from '@/shared/domain/enums';
import { ApiReturnError, createInvalidTokenError, ErrorFactory } from '@/shared/domain/errors';
import { JwtPayload, JwtTokenResult, TempTokenPayload } from '@/shared/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Servicio que gestiona emisión y validación de tokens JWT.
 *
 * @public
 */
@Injectable()
export class JwtTokenService {
  private static readonly invalidTokenMessage = 'Invalid token';

  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
    @InjectPinoLogger(JwtTokenService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Genera un token de acceso para el usuario autenticado.
   *
   * @param user - Usuario del cual se emiten claims
   * @returns Token con fechas de emisión y expiración
   * @throws Error si la firma del token falla
   */
  async generateAccessToken(user: UserEntity): Promise<JwtTokenResult> {
    this.logger.assign({ method: 'generateAccessToken' });
    this.logger.info('Generating access token');
    try {
      // Crear una copia del usuario sin el password por seguridad
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;

      const tokenPayload: JwtPayload = {
        sub: user.id,
        user: userWithoutPassword,
      };

      return this.generateToken(tokenPayload, this.config.expiresIn);
    } catch (error: unknown) {
      this.logger.error({ error }, 'Failed to generate access token');
      throw ErrorFactory.createInternalServerError('ACCESS_TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Genera un token temporal según el tipo solicitado.
   *
   * @param sub - Identificador del sujeto del token
   * @param user - Usuario asociado al token temporal
   * @param type - Tipo de token temporal requerido
   * @returns Token temporal con metadatos de expiración
   * @throws Error si la firma del token falla
   */
  async generateTempToken(
    sub: string,
    user: UserEntity,
    type: JwtTempTokenType,
  ): Promise<JwtTokenResult> {
    this.logger.assign({ method: 'generateTempToken' });

    try {
      const expiresIn = this.getTempTokenExpiration(type);

      // Crear una copia del usuario sin el password por seguridad
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;

      const payload: TempTokenPayload = {
        sub,
        user: userWithoutPassword,
        type,
      };

      return this.generateToken(payload, expiresIn);
    } catch (error: unknown) {
      this.logger.error({ error }, 'Failed to generate temporary token');
      throw ErrorFactory.createInternalServerError('TEMP_TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Firma un token JWT con la configuración indicada.
   *
   * @param payload - Datos que se incluirán en el token
   * @param expiresIn - Tiempo de expiración configurado
   * @returns Token firmado con fechas de emisión y caducidad
   * @throws Error si la generación del token produce errores
   */
  private async generateToken(
    payload: JwtPayload | TempTokenPayload,
    expiresIn: string | number,
  ): Promise<JwtTokenResult> {
    this.logger.assign({ method: 'generateToken' });
    // Determinar tipo de token para logging
    let tokenType = 'Access token';

    // Si el payload tiene campo 'type', es un token temporal
    if ('type' in payload) {
      tokenType = `Temp token (${payload.type})`;
    }

    try {
      // Fecha de creación del token
      const createdAt = new Date();

      // Generar el token
      const token = await this.jwtService.signAsync(payload, {
        expiresIn: expiresIn as never,
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      // Calcular fecha de expiración
      const expiredAt = this.calculateExpirationDate(expiresIn, createdAt);

      return {
        token,
        createdAt,
        expiredAt,
      };
    } catch (err: unknown) {
      const error = err as Error;

      this.logger.error({ error }, `Failed to generate ${tokenType.toLowerCase()}`);

      throw ErrorFactory.createInternalServerError('TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Valida un token JWT y retorna su payload verificando claims.
   *
   * @typeParam T - Tipo de payload esperado
   * @param token - Token JWT a verificar
   * @returns Payload validado sin modificar
   * @throws ApiReturnError si la validación del token falla
   */
  async validateToken<T extends object = JwtPayload>(token: string): Promise<T> {
    this.logger.assign({ method: 'validateToken' });

    try {
      const payload = await this.jwtService.verifyAsync<T>(token, {
        secret: this.config.secret,
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      // Validar estructura base del payload (común para todos los tipos)
      this.validateBasePayloadStructure(payload);

      // Validar estructura específica del tipo de token temporal
      if (this.isTempTokenPayload(payload)) {
        this.validateTempTokenType(payload);
      }

      return payload;
    } catch (error: unknown) {
      // manejar error de token expirado
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw ErrorFactory.createUnauthorizedError({
          code: 'TOKEN_EXPIRED',
          message: 'The token has expired',
        });
      }

      // si el error es de tipo ApiReturnError, se retorna tal cual
      if (error instanceof ApiReturnError) {
        throw error;
      }

      this.logger.warn({ error }, 'Token validation failed');
      throw ErrorFactory.createUnauthorizedError({
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }
  }

  /**
   * Obtiene la caducidad asociada a un token temporal.
   *
   * @param type - Tipo de token temporal solicitado
   * @returns Duración configurada para el token
   */
  private getTempTokenExpiration(type: JwtTempTokenType): string {
    switch (type) {
      case JwtTempTokenType.FORGOT_PASSWORD:
        return this.config.tempTokens.forgot_password;
      case JwtTempTokenType.RESET_PASSWORD:
        return this.config.tempTokens.reset_password;
      case JwtTempTokenType.VERIFY_EMAIL:
        return this.config.tempTokens.verify_email;
      default:
        return '15m'; // Fallback por defecto
    }
  }

  /**
   * Calcula la fecha de caducidad a partir de una duración dada.
   *
   * @param duration - Duración expresada en formato válido
   * @param createdAt - Fecha de emisión del token
   * @returns Fecha exacta de caducidad
   */
  private calculateExpirationDate(duration: string | number, createdAt: Date): Date {
    let milliseconds: number;

    if (typeof duration === 'number') {
      // Si es número, se asume que son segundos
      milliseconds = duration * 1000;
    } else {
      // Si es string, parsear el formato (ej: '1h', '7d', '60m')
      milliseconds = this.parseDuration(duration);
    }

    return new Date(createdAt.getTime() + milliseconds);
  }

  /**
   * Transforma una duración con sufijo en milisegundos.
   *
   * @param duration - Duración con sufijo s, m, h o d
   * @returns Duración equivalente en milisegundos
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      this.logger.warn({ duration }, 'Invalid duration format, defaulting to 1 hour');
      return 60 * 60 * 1000; // 1 hora por defecto
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000, // segundos
      m: 60 * 1000, // minutos
      h: 60 * 60 * 1000, // horas
      d: 24 * 60 * 60 * 1000, // días
    };

    return value * multipliers[unit];
  }

  /**
   * Verifica que el payload contenga los campos mínimos requeridos.
   *
   * @param payload - Datos obtenidos tras validar el token
   * @throws ApiReturnError si la estructura es inválida
   */
  private validateBasePayloadStructure(payload: unknown): void {
    this.logger.assign({ method: 'validateBasePayloadStructure' });

    if (typeof payload !== 'object' || payload === null) {
      this.logger.warn(
        { reason: 'payload_not_object' },
        'Invalid payload structure: payload must be an object',
      );
      throw createInvalidTokenError(JwtTokenService.invalidTokenMessage);
    }

    const typedPayload = payload as Record<string, unknown>;

    if (!typedPayload.sub || !typedPayload.user) {
      this.logger.warn(
        { reason: 'missing_sub_or_user' },
        'Invalid payload structure: missing sub or user fields',
      );
      throw createInvalidTokenError(JwtTokenService.invalidTokenMessage);
    }

    if (typeof typedPayload.sub !== 'string') {
      this.logger.warn(
        { reason: 'sub_not_string', currentType: typeof typedPayload.sub },
        'Invalid payload structure: sub must be a string',
      );
      throw createInvalidTokenError(JwtTokenService.invalidTokenMessage);
    }

    if (typeof typedPayload.user !== 'object' || typedPayload.user === null) {
      this.logger.warn(
        { reason: 'user_not_object', currentType: typeof typedPayload.user },
        'Invalid payload structure: user must be an object',
      );
      throw createInvalidTokenError(JwtTokenService.invalidTokenMessage);
    }
  }

  /**
   * Determina si el payload corresponde a un token temporal.
   *
   * @param payload - Datos a clasificar
   * @returns Verdadero cuando el payload es temporal
   */
  private isTempTokenPayload(payload: unknown): payload is TempTokenPayload {
    return typeof payload === 'object' && payload !== null && 'type' in payload;
  }

  /**
   * Valida que el tipo del token temporal pertenezca al enum válido.
   *
   * @param payload - Datos del token temporal
   * @throws ApiReturnError si el tipo no es admitido
   */
  private validateTempTokenType(payload: TempTokenPayload): void {
    this.logger.assign({ method: 'validateTempTokenType' });

    if (!payload.type) {
      this.logger.warn(
        { reason: 'missing_type' },
        'Invalid temp token payload structure: missing type',
      );
      throw createInvalidTokenError(JwtTokenService.invalidTokenMessage);
    }

    // Validar que el tipo sea un valor válido del enum
    if (!Object.values(JwtTempTokenType).includes(payload.type)) {
      this.logger.warn(
        { reason: 'invalid_type', type: payload.type },
        'Invalid temp token payload structure: invalid type',
      );
      throw createInvalidTokenError(JwtTokenService.invalidTokenMessage);
    }
  }
}
