import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { PermissionEntity } from '../../domain/entities';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repositories';
import { FindUserPermissionsArgsDto } from '../dto';

/**
 * Caso de uso para obtener todos los permisos asignados a un usuario específico.
 *
 * @remarks
 * Retorna solo los permisos asignados explícitamente al usuario,
 * no incluye los permisos que provienen del rol base del usuario.
 *
 * @public
 */
@Injectable()
export class FindUserPermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @InjectPinoLogger(FindUserPermissionsUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta la búsqueda de permisos asignados a un usuario.
   *
   * @param args - Argumentos que contienen el filtro con userId
   * @returns Array de entidades de permisos del usuario
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   * @throws NotFoundError si el usuario no existe
   */
  async execute(args: FindUserPermissionsArgsDto): Promise<PermissionEntity[]> {
    const { userId } = args.filter;
    this.logger.info({ userId }, 'Finding user permissions');

    const permissions = await this.permissionRepository.findUserPermissions(userId);

    this.logger.info(
      { userId, count: permissions.length },
      'User permissions retrieved successfully',
    );

    return permissions;
  }
}
