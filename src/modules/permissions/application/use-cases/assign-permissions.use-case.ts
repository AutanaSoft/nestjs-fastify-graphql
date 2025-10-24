import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { createPermissionNotFoundError } from '../../domain/errors';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repositories';
import { AssignPermissionsResult } from '../../domain/types';
import { AssignPermissionsArgsDto } from '../dto';

/**
 * Caso de uso para asignar permisos adicionales a un usuario.
 *
 * @remarks
 * Este caso de uso permite otorgar permisos específicos a un usuario más allá
 * de los permisos base que provienen de su rol. Los permisos se asignan por nombre
 * y se valida su existencia antes de la asignación.
 *
 * @public
 */
@Injectable()
export class AssignPermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @InjectPinoLogger(AssignPermissionsUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta la asignación de permisos a un usuario.
   *
   * @param args - Argumentos que contienen userId y permissionNames
   * @returns Resultado con permisos asignados y ya existentes
   * @throws DomainBaseError si algún permiso no existe, el usuario no existe, o falla la persistencia
   */
  async execute(args: AssignPermissionsArgsDto): Promise<AssignPermissionsResult> {
    const { userId, permissionNames } = args.input;

    this.logger.info({ userId, permissionNames }, 'Assigning permissions to user');

    // Verificar que todos los permisos existan
    const permissions = await this.permissionRepository.findByNames(permissionNames);
    const foundNames = new Set(permissions.map((p) => p.name));
    const notFound = permissionNames.filter((name) => !foundNames.has(name));

    if (notFound.length > 0) {
      this.logger.warn({ userId, notFound }, 'Some permissions not found');
      throw createPermissionNotFoundError(notFound[0]);
    }

    // Obtener permisos actuales del usuario
    const currentPermissions = await this.permissionRepository.findUserPermissions(userId);
    const currentNames = new Set(currentPermissions.map((p) => p.name));

    // Determinar cuáles permisos son nuevos y cuáles ya existen
    const toAssign = permissions.filter((p) => !currentNames.has(p.name));
    const alreadyAssigned = permissions.filter((p) => currentNames.has(p.name));

    // Asignar solo los permisos que no tiene el usuario
    if (toAssign.length > 0) {
      const permissionIds = toAssign.map((p) => p.id);
      await this.permissionRepository.assignPermissions(userId, permissionIds);
    }

    const result: AssignPermissionsResult = {
      userId,
      assignedPermissions: toAssign.map((p) => p.name),
      alreadyAssigned: alreadyAssigned.map((p) => p.name),
    };

    this.logger.info(
      {
        userId,
        assigned: result.assignedPermissions.length,
        alreadyAssigned: result.alreadyAssigned.length,
      },
      'Permissions assignment completed',
    );

    return result;
  }
}
