import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { PermissionEntity } from '../../domain/entities';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repositories';
import { FindAllPermissionsArgsDto } from '../dto';

/**
 * Caso de uso para obtener todos los permisos del sistema.
 *
 * @remarks
 * Opcionalmente puede filtrar permisos por un término de búsqueda que coincida
 * con el nombre o descripción del permiso.
 *
 * @public
 */
@Injectable()
export class FindAllPermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @InjectPinoLogger(FindAllPermissionsUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta la búsqueda de todos los permisos del sistema.
   *
   * @param args - Argumentos que pueden contener filtros de búsqueda
   * @returns Array de entidades de permisos
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   */
  async execute(args: FindAllPermissionsArgsDto): Promise<PermissionEntity[]> {
    this.logger.info({ filter: args.filter }, 'Finding all permissions');

    const permissions = await this.permissionRepository.findAll();

    // Aplicar filtro de búsqueda si existe
    if (args.filter?.search) {
      const searchTerm = args.filter.search.toLowerCase();
      const filtered = permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.description?.toLowerCase().includes(searchTerm),
      );

      this.logger.info({ count: filtered.length, search: searchTerm }, 'Permissions filtered');
      return filtered;
    }

    this.logger.info({ count: permissions.length }, 'All permissions retrieved');
    return permissions;
  }
}
