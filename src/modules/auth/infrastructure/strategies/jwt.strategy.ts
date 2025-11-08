import { jwtConfig } from '@/config';
import { UserEntity } from '@/modules/users/domain/entities';
import { USER_REPOSITORY, UserRepository } from '@/modules/users/domain/repository';
import { DomainBaseError } from '@/shared/domain/errors';
import { JwtPayload } from '@/shared/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createInvalidCredentialsError } from '../../domain/errors';

/**
 * Estrategia de autenticación JWT para validar tokens de acceso.
 *
 * Implementa la validación de tokens JWT usando Passport.js. Extrae el token del header
 * Authorization, verifica su firma y expiración, y recupera el usuario completo desde
 * la base de datos con sus permisos actualizados.
 *
 * @remarks
 * - Se ejecuta automáticamente al usar `@UseGuards(JwtAuthGuard)`
 * - Extrae el token del header `Authorization: Bearer <token>`
 * - Valida firma, expiración, issuer y audience del token
 * - Recupera el usuario actualizado desde la base de datos (incluye permisos)
 * - Si el usuario no existe, se considera el token como inválido (seguridad)
 *
 * @throws {InvalidCredentialsError} Cuando el token es inválido o el usuario no existe
 *
 * @public
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
   * Valida el payload del JWT y recupera el usuario actualizado desde la base de datos.
   *
   * Este método es invocado automáticamente por Passport después de verificar la firma,
   * expiración, issuer y audience del token. Recupera el usuario completo con sus permisos
   * actualizados para garantizar que los datos en el contexto de la petición sean actuales.
   *
   * @param payload - Payload decodificado del token conteniendo `sub` (userId) y `user`
   * @returns Entidad del usuario con permisos actualizados desde la base de datos
   *
   * @throws {InvalidCredentialsError} Cuando el usuario no existe en la base de datos
   *
   * @remarks
   * Seguridad: Si el usuario no existe, se lanza el mismo error que para credenciales
   * inválidas para evitar revelar si el usuario existe o no (prevención de enumeración).
   */
  async validate(payload: JwtPayload): Promise<UserEntity> {
    this.logger.debug({
      method: 'validate',
      userId: payload.sub,
      username: payload.user?.userName,
    });

    try {
      // Buscar el usuario actual en la base de datos (incluye permisos)
      const userResult = await this.userRepository.findById(payload.sub);
      if (userResult instanceof DomainBaseError) throw userResult;
      const currentUser = userResult;

      if (!currentUser) {
        this.logger.warn({ userId: payload.sub }, 'User not found in database');
        throw createInvalidCredentialsError();
      }

      this.logger.debug(
        { userId: currentUser.id, permissionsCount: currentUser.permissions.length },
        'JWT token validated successfully',
      );

      return currentUser;
    } catch (error: unknown) {
      if (error instanceof DomainBaseError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: errorMessage }, 'JWT validation failed');
      throw createInvalidCredentialsError();
    }
  }
}
