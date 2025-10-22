import { jwtConfig } from '@/config';
import { UserEntity } from '@/modules/users/domain/entities';
import { InvalidTokenDomainException, TokenExpiredDomainException } from '@/shared/domain/errors';
import { JwtPayload } from '@/shared/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Estrategia de autenticación JWT basada en Passport.
 *
 * Implementa la validación de tokens JWT para proteger rutas y recursos.
 * Verifica la firma, expiración y estructura del payload del token,
 * extrayendo la información del usuario autenticado.
 *
 * @remarks
 * Esta estrategia se configura automáticamente con los parámetros del
 * archivo de configuración JWT (secreto, emisor, audiencia).
 * Extrae el token del header Authorization como Bearer token.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Crea una instancia de la estrategia JWT.
   *
   * @param config - Configuración JWT tipada que incluye secreto, emisor y audiencia
   * @param logger - Logger de Pino para registrar eventos de autenticación
   */
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
    @InjectPinoLogger(JwtStrategy.name)
    private readonly logger: PinoLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
      issuer: config.issuer,
      audience: config.audience,
    });
  }

  /**
   * Valida el payload del token JWT y retorna la entidad del usuario.
   *
   * Verifica la estructura del payload del token JWT decodificado,
   * asegurando que contenga los campos requeridos (sub y user).
   *
   * @param payload - Payload del token JWT decodificado que contiene
   *                  la información del usuario y el subject (sub)
   * @returns Entidad del usuario extraída del payload
   * @throws {InvalidTokenDomainException} Si el payload no tiene la estructura esperada
   *                                       o si ocurre un error durante la validación
   * @throws {TokenExpiredDomainException} Si el token ha expirado
   */
  validate(payload: JwtPayload): UserEntity {
    this.logger.debug({
      method: 'validate',
      userId: payload.sub,
      username: payload.user?.userName,
    });

    try {
      // Validar la estructura del payload
      if (!payload.sub || !payload.user) {
        this.logger.warn('Invalid JWT payload structure');
        throw new InvalidTokenDomainException();
      }

      // Validación adicional puede agregarse aquí si es necesario
      // Por ejemplo: verificar si el usuario está activo, no está baneado, etc.

      this.logger.debug('JWT token validated successfully');
      return payload.user;
    } catch (error: unknown) {
      if (
        error instanceof InvalidTokenDomainException ||
        error instanceof TokenExpiredDomainException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: errorMessage }, 'JWT validation failed');
      throw new InvalidTokenDomainException();
    }
  }
}
