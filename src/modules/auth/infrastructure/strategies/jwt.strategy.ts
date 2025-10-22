import { jwtConfig } from '@/config';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserStatus } from '@/modules/users/domain/enums';
import { USER_REPOSITORY, UserRepository } from '@/modules/users/domain/repository';
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
   * @param userRepository - Repositorio para buscar datos actuales del usuario
   * @param logger - Logger de Pino para registrar eventos de autenticación
   */
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
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
   * Valida el payload del token JWT y retorna la entidad del usuario con permisos actuales.
   *
   * Verifica la estructura del payload del token JWT decodificado y busca los datos
   * actuales del usuario y sus permisos desde la base de datos para asegurar que
   * la información esté fresca y actualizada.
   *
   * @param payload - Payload del token JWT decodificado que contiene
   *                  la información del usuario y el subject (sub)
   * @returns Entidad del usuario con sus permisos actuales de la base de datos
   * @throws {InvalidTokenDomainException} Si el payload no tiene la estructura esperada,
   *                                       si el usuario no existe o está inactivo
   * @throws {TokenExpiredDomainException} Si el token ha expirado
   */
  async validate(payload: JwtPayload): Promise<UserEntity> {
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

      // Buscar el usuario actual en la base de datos (incluye permisos)
      const currentUser = await this.userRepository.findById(payload.sub);
      if (!currentUser) {
        this.logger.warn({ userId: payload.sub }, 'User not found in database');
        throw new InvalidTokenDomainException();
      }

      // Validar que el usuario esté activo
      if (currentUser.status === UserStatus.SUSPENDED || currentUser.status === UserStatus.BANNED) {
        this.logger.warn(
          { userId: payload.sub, status: currentUser.status },
          'User account is inactive',
        );
        throw new InvalidTokenDomainException();
      }

      this.logger.debug(
        { userId: currentUser.id, permissionsCount: currentUser.permissions.length },
        'JWT token validated successfully',
      );

      return currentUser;
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
