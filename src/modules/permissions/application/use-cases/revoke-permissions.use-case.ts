import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { PermissionNotFoundError } from '../../domain/errors';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repositories';
import { RevokePermissionsResult } from '../../domain/types';
import { RevokePermissionsArgsDto } from '../dto';

/**
 * Caso de uso para revocar permisos de un usuario.
 *
 * @remarks
 * Este caso de uso permite remover permisos asignados explícitamente a un usuario.
 * No afecta los permisos que provienen del rol base del usuario.
 *
 * @public
 */
@Injectable()
export class RevokePermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @InjectPinoLogger(RevokePermissionsUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta la revocación de permisos de un usuario.
   *
   * @param args - Argumentos que contienen userId y permissionNames
   * @returns Resultado con permisos revocados y no asignados
   * @throws PermissionNotFoundError si algún permiso no existe
   * @throws DataBaseError cuando ocurre un fallo de persistencia
   */
  async execute(args: RevokePermissionsArgsDto): Promise<RevokePermissionsResult> {
    const { userId, permissionNames } = args.input;

    this.logger.info({ userId, permissionNames }, 'Revoking permissions from user');

    // Verificar que todos los permisos existan
    const permissions = await this.permissionRepository.findByNames(permissionNames);
    const foundNames = new Set(permissions.map((p) => p.name));
    const notFound = permissionNames.filter((name) => !foundNames.has(name));

    if (notFound.length > 0) {
      this.logger.warn({ userId, notFound }, 'Some permissions not found');
      throw new PermissionNotFoundError(notFound[0]);
    }

    // Obtener permisos actuales del usuario
    const currentPermissions = await this.permissionRepository.findUserPermissions(userId);
    const currentNames = new Set(currentPermissions.map((p) => p.name));

    // Determinar cuáles permisos están asignados y cuáles no
    const toRevoke = permissions.filter((p) => currentNames.has(p.name));
    const notAssigned = permissions.filter((p) => !currentNames.has(p.name));

    // Revocar solo los permisos que tiene el usuario
    if (toRevoke.length > 0) {
      const permissionIds = toRevoke.map((p) => p.id);
      await this.permissionRepository.revokePermissions(userId, permissionIds);
    }

    const result: RevokePermissionsResult = {
      userId,
      revokedPermissions: toRevoke.map((p) => p.name),
      notAssigned: notAssigned.map((p) => p.name),
    };

    this.logger.info(
      {
        userId,
        revoked: result.revokedPermissions.length,
        notAssigned: result.notAssigned.length,
      },
      'Permissions revocation completed',
    );

    return result;
  }
}
