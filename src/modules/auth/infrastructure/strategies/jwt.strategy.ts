import { jwtConfig } from '@/config';
import { UserEntity } from '@/modules/users/domain/entities';
import { InvalidTokenDomainException, TokenExpiredDomainException } from '@/shared/domain/errors';
import { JwtPayload } from '@/shared/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Logger } from 'nestjs-pino';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Estrategia de autenticación JWT para Passport.
 *
 * Esta estrategia valida tokens JWT y extrae la información del usuario desde el payload del token.
 * Se integra con Passport para proporcionar autenticación automática en rutas protegidas.
 *
 * Siguiendo las mejores prácticas de NestJS, esta estrategia:
 * - Valida tokens usando la configuración JWT compartida
 * - Extrae tokens del header Authorization Bearer
 * - Retorna la entidad de usuario para uso en el pipeline de requests
 * - Maneja errores de validación de tokens apropiadamente
 *
 * @public
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
    private readonly logger: Logger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
      issuer: config.issuer,
      audience: config.audience,
    });

    this.logger.log('JwtStrategy initialized');
  }

  /**
   * Valida el payload del JWT y retorna la entidad de usuario.
   *
   * Este método es llamado por Passport después de que la firma del JWT es verificada.
   * Valida la estructura del payload y retorna el usuario para adjuntarlo al request.
   *
   * @param payload - El payload decodificado del JWT.
   * @returns La entidad de usuario para adjuntar al request.
   * @throws InvalidTokenDomainException cuando el payload es inválido.
   * @throws TokenExpiredDomainException cuando el token ha expirado.
   *
   * @public
   */
  validate(payload: JwtPayload): UserEntity {
    this.logger.log({
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
