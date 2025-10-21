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
 * Servicio JWT para manejar operaciones genéricas de tokens JWT.
 * Este servicio puede ser reutilizado en diferentes módulos que necesiten funcionalidad JWT.
 * Se enfoca únicamente en la generación y validación de tokens JWT, no en lógica de negocio.
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

  // Métodos públicos

  /**
   * Genera un access token JWT para el usuario dado.
   * @param user Entidad del usuario conteniendo su información.
   * @returns Promise que resuelve al string del access token JWT firmado.
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
   * Genera un token JWT temporal para acciones específicas (reset de contraseña, verificación de email, etc.).
   * @param sub Identificador único para el token (UUID para validación en base de datos).
   * @param user Entidad del usuario para quien se genera el token.
   * @param type Tipo de token temporal siendo generado.
   * @returns Promise que resuelve al string del token JWT temporal firmado.
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
   * Valida y verifica un token JWT.
   * @param token String del token JWT a validar.
   * @returns Promise que resuelve al payload JWT validado.
   * @throws TokenExpiredDomainException cuando el token ha expirado.
   * @throws InvalidTokenDomainException cuando el token es inválido o malformado.
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

  // Métodos privados

  /**
   * Genera un token JWT con el payload y opciones especificadas.
   * Este es un método genérico usado internamente por otros métodos de generación de tokens.
   * @param payload El payload a incluir en el token.
   * @param expiresIn Tiempo de expiración para el token (ej: '15m', '1h', '7d').
   * @param tokenType Tipo de token siendo generado (para propósitos de logging).
   * @returns Promise que resuelve al string del token JWT firmado.
   * @private
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
   * Método auxiliar para obtener el tiempo de expiración de tokens temporales basado en el tipo.
   * @param type Tipo de token temporal.
   * @returns String del tiempo de expiración (ej: '15m', '1h', '7d').
   * @private
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
