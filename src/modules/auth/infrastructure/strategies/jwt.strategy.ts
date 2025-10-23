import { jwtConfig } from '@/config';
import { UserEntity } from '@/modules/users/domain/entities';
import { USER_REPOSITORY, UserRepository } from '@/modules/users/domain/repository';
import { InvalidTokenDomainException, TokenExpiredDomainException } from '@/shared/domain/errors';
import { JwtPayload } from '@/shared/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Estrategia de autenticación JWT que extiende PassportStrategy.
 *
 * Valida tokens JWT extraídos del header Authorization y verifica
 * que el usuario asociado exista en la base de datos con sus permisos actualizados.
 *
 * @remarks
 * Esta estrategia se ejecuta automáticamente cuando se usa el guard JwtAuthGuard.
 * Extrae el token del header `Authorization: Bearer <token>`, lo valida contra
 * el secreto configurado y recupera el usuario completo con sus permisos.
 *
 * @throws {InvalidTokenDomainException} Si el token es inválido o el usuario no existe
 * @throws {TokenExpiredDomainException} Si el token ha expirado
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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
   * Valida el payload del token JWT y recupera el usuario completo.
   *
   * @param payload - Payload decodificado del token JWT que contiene sub (userId) y user
   * @returns Entidad del usuario con sus permisos actualizados desde la base de datos
   *
   * @throws {InvalidTokenDomainException} Si el usuario no existe en la base de datos
   *
   * @remarks
   * Este método es invocado automáticamente por Passport después de verificar
   * la firma, expiración y estructura del token. Solo se encarga de verificar
   * que el usuario todavía existe en la base de datos y retorna la entidad actualizada.
   */
  async validate(payload: JwtPayload): Promise<UserEntity> {
    this.logger.debug({
      method: 'validate',
      userId: payload.sub,
      username: payload.user?.userName,
    });

    try {
      // Buscar el usuario actual en la base de datos (incluye permisos)
      const currentUser = await this.userRepository.findById(payload.sub);
      if (!currentUser) {
        this.logger.warn({ userId: payload.sub }, 'User not found in database');
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
