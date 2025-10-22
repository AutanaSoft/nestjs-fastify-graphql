import { jwtConfig } from '@/config';
import { UserEntity } from '@/modules/users/domain/entities';
import { JwtTempTokenType } from '@/shared/domain/enums';
import { InvalidTokenDomainException, TokenExpiredDomainException } from '@/shared/domain/errors';
import { JwtPayload, TempTokenPayload } from '@/shared/domain/types';
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
   * @returns Token JWT firmado como string
   * @throws Error si falla la generación del token
   */
  async generateAccessToken(user: UserEntity): Promise<string> {
    this.logger.info({ method: 'generateAccessToken', userId: user.id });

    const tokenPayload: JwtPayload = {
      sub: user.id,
      user,
    };

    return this.generateToken(tokenPayload, this.config.expiresIn, 'access token');
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
   * @returns Token JWT temporal firmado como string
   * @throws Error si falla la generación del token
   */
  async generateTempToken(sub: string, user: UserEntity, type: JwtTempTokenType): Promise<string> {
    this.logger.info({ method: 'generateTempToken' });

    try {
      const expiresIn = this.getTempTokenExpiration(type);

      const payload: TempTokenPayload = {
        sub,
        user,
        type,
      };

      return this.generateToken(payload, expiresIn, 'temporary token');
    } catch (error: unknown) {
      this.logger.error({ error }, 'Failed to generate temporary token');
      throw new Error('Failed to generate temporary token');
    }
  }

  /**
   * Valida un token JWT y extrae su payload.
   *
   * Verifica la firma, expiración, emisor y audiencia del token.
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

      this.logger.debug('Token validated successfully');
      return payload;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        this.logger.warn('Token has expired');
        throw new TokenExpiredDomainException();
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn({ error: errorMessage }, 'Invalid token');
      throw new InvalidTokenDomainException();
    }
  }

  /**
   * Genera un token JWT con el payload y configuración especificados.
   *
   * @param payload - Datos a incluir en el token (JwtPayload o TempTokenPayload)
   * @param expiresIn - Tiempo de expiración del token
   * @param tokenType - Descripción del tipo de token para logging
   * @returns Token JWT firmado como string
   * @throws Error si falla la generación del token
   */
  private async generateToken(
    payload: JwtPayload | TempTokenPayload,
    expiresIn: string | number,
    tokenType: string,
  ): Promise<string> {
    this.logger.info({ method: 'generateToken', tokenType });

    try {
      const token = await this.jwtService.signAsync(payload, {
        expiresIn: expiresIn as never,
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      this.logger.info(`${tokenType} generated successfully`);
      return token;
    } catch (error: unknown) {
      this.logger.error({ error }, `Failed to generate ${tokenType}`);
      throw new Error(`Failed to generate ${tokenType}`);
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
        return this.config.tempTokens.forgotPassword;
      case JwtTempTokenType.RESET_PASSWORD:
        return this.config.tempTokens.resetPassword;
      case JwtTempTokenType.REFRESH_TOKEN:
        return this.config.tempTokens.refreshToken;
      default:
        return '15m'; // Fallback por defecto
    }
  }
}
