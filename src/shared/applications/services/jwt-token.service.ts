import { jwtConfig } from '@/config';
import { UserEntity } from '@/modules/users/domain/entities';
import { JwtTempTokenType } from '@/shared/domain/enums';
import { ErrorFactory } from '@/shared/domain/errors';
import { JwtPayload, JwtTokenResult, TempTokenPayload } from '@/shared/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Servicio para la generación y validación de tokens JWT.
 *
 * Proporciona funcionalidad para crear tokens de acceso y tokens temporales
 * (refresh, reset password, forgot password), así como para validar tokens existentes.
 *
 * @public
 */
@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
    @InjectPinoLogger(JwtTokenService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Genera un token de acceso JWT para un usuario autenticado.
   *
   * @param user - Entidad del usuario para el cual se genera el token
   * @returns Objeto con el token generado y sus fechas de creación y expiración
   * @throws Error si falla la generación del token
   */
  async generateAccessToken(user: UserEntity): Promise<JwtTokenResult> {
    this.logger.info({ method: 'generateAccessToken', userId: user.id });

    // Crear una copia del usuario sin el password por seguridad
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    const tokenPayload: JwtPayload = {
      sub: user.id,
      user: userWithoutPassword,
    };

    return this.generateToken(tokenPayload, this.config.expiresIn);
  }

  /**
   * Genera un token temporal JWT según el tipo especificado.
   *
   * Los tipos de tokens temporales incluyen: refresh token, reset password
   * y forgot password. Cada tipo tiene su propia configuración de expiración.
   *
   * @param sub - Identificador del sujeto del token (típicamente user ID o email)
   * @param user - Entidad del usuario asociada al token
   * @param type - Tipo de token temporal a generar
   * @returns Objeto con el token generado y sus fechas de creación y expiración
   * @throws Error si falla la generación del token
   */
  async generateTempToken(
    sub: string,
    user: UserEntity,
    type: JwtTempTokenType,
  ): Promise<JwtTokenResult> {
    this.logger.info({ method: 'generateTempToken' });

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
      throw new Error('Failed to generate temporary token');
    }
  }

  /**
   * Valida un token JWT y extrae su payload.
   *
   * Verifica la firma, expiración, emisor, audiencia y estructura del token.
   * Aplica validación base común y validación específica según el tipo de token.
   *
   * @typeParam T - Tipo del payload esperado, por defecto JwtPayload
   * @param token - Token JWT a validar
   * @returns Payload del token validado
   * @throws TokenExpiredDomainException si el token ha expirado
   * @throws InvalidTokenDomainException si el token es inválido o la verificación falla
   */
  async validateToken<T extends object = JwtPayload>(token: string): Promise<T> {
    this.logger.info({ method: 'validateToken' });

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

      this.logger.debug('Token validated successfully');
      return payload;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        this.logger.warn('Token has expired');
        throw ErrorFactory.createUnauthorizedError({
          code: 'TOKEN_EXPIRED',
          message: 'The token has expired',
        });
      }

      throw ErrorFactory.createUnauthorizedError({
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }
  }

  /**
   * Genera un token JWT con el payload y configuración especificados.
   *
   * @param payload - Datos a incluir en el token (JwtPayload o TempTokenPayload)
   * @param expiresIn - Tiempo de expiración del token
   * @returns Objeto con el token generado y metadata temporal
   * @throws Error si falla la generación del token
   */
  private async generateToken(
    payload: JwtPayload | TempTokenPayload,
    expiresIn: string | number,
  ): Promise<JwtTokenResult> {
    // Determinar tipo de token para logging
    let tokenType = 'Access token';

    // Si el payload tiene campo 'type', es un token temporal
    if ('type' in payload) {
      tokenType = `Temp token (${payload.type})`;
    }

    this.logger.info({ method: 'generateToken', tokenType });

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

      this.logger.info(`${tokenType} generated successfully`);

      return {
        token,
        createdAt,
        expiredAt,
      };
    } catch (err: unknown) {
      const error = err as Error;
      throw ErrorFactory.createInternalServerError({
        message: `Failed to generate ${tokenType.toLowerCase()}`,
        code: 'TOKEN_GENERATION_FAILED',
        options: {
          originalError: error,
          extensions: {
            service: 'JwtTokenService',
            method: 'generateToken',
          },
        },
      });
    }
  }

  /**
   * Obtiene el tiempo de expiración configurado para un tipo de token temporal.
   *
   * @param type - Tipo de token temporal
   * @returns Tiempo de expiración como string (ej: '15m', '1h', '7d')
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
   * Calcula la fecha de expiración basándose en la duración y fecha de creación.
   *
   * @param duration - Duración del token (ej: '1h', '7d', '60m', o número en segundos)
   * @param createdAt - Fecha de creación del token
   * @returns Fecha de expiración calculada
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
   * Parsea una duración en formato string a milisegundos.
   *
   * Soporta formatos: 's' (segundos), 'm' (minutos), 'h' (horas), 'd' (días)
   *
   * @param duration - Duración en formato string (ej: '7d', '24h', '60m')
   * @returns Duración en milisegundos
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
   * Verifica si el payload es de tipo TempTokenPayload.
   *
   * @param payload - Payload a verificar
   * @returns true si es un TempTokenPayload, false si es otro tipo
   */
  private isTempTokenPayload(payload: unknown): payload is TempTokenPayload {
    return typeof payload === 'object' && payload !== null && 'type' in payload;
  }

  /**
   * Valida la estructura base de un payload JWT (campos comunes).
   *
   * @param payload - Payload JWT a validar
   * @throws InvalidTokenDomainException si la estructura base es inválida
   */
  private validateBasePayloadStructure(payload: unknown): void {
    if (typeof payload !== 'object' || payload === null) {
      this.logger.warn('Invalid payload structure: payload must be an object');
      throw ErrorFactory.createUnauthorizedError({
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }

    const typedPayload = payload as Record<string, unknown>;

    if (!typedPayload.sub || !typedPayload.user) {
      this.logger.warn('Invalid payload structure: missing sub or user');
      throw ErrorFactory.createUnauthorizedError({
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }

    if (typeof typedPayload.sub !== 'string') {
      this.logger.warn('Invalid payload structure: sub must be a string');
      throw ErrorFactory.createUnauthorizedError({
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }

    if (typeof typedPayload.user !== 'object' || typedPayload.user === null) {
      this.logger.warn('Invalid payload structure: user must be an object');
      throw ErrorFactory.createUnauthorizedError({
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }
  }

  /**
   * Valida el tipo específico de un token temporal.
   *
   * @param payload - Payload de token temporal a validar
   * @throws InvalidTokenDomainException si el tipo es inválido
   */
  private validateTempTokenType(payload: TempTokenPayload): void {
    if (!payload.type) {
      this.logger.warn('Invalid temp token payload structure: missing type');
      throw ErrorFactory.createUnauthorizedError({
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }

    // Validar que el tipo sea un valor válido del enum
    if (!Object.values(JwtTempTokenType).includes(payload.type)) {
      this.logger.warn(
        { type: payload.type },
        'Invalid temp token payload structure: invalid type',
      );
      throw ErrorFactory.createUnauthorizedError({
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      });
    }
  }
}
