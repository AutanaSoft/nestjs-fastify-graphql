import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { HandlerOrmErrorsService, PrismaService } from '@/shared/applications/services';
import { DomainBaseError } from '@/shared/domain/errors';
import { PermissionEntity } from '../../domain/entities';
import { PermissionRepository } from '../../domain/repositories';
import { PERMISSION_ORM_ERROR_CONFIG } from '../config/permission-orm-errors.config';

/**
 * Implementa el repositorio de permisos utilizando Prisma ORM como adaptador.
 *
 * @remarks
 * Este adaptador traduce las operaciones del dominio a consultas de Prisma,
 * maneja errores de infraestructura y mapea los resultados a entidades de dominio.
 *
 * @public
 */
@Injectable()
export class PermissionPrismaAdapter implements PermissionRepository {
  constructor(
    @InjectPinoLogger(PermissionPrismaAdapter.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly handlerOrmErrorsService: HandlerOrmErrorsService,
  ) {}

  /**
   * Recupera todos los permisos disponibles en el sistema.
   *
   * @returns Promesa con el array de entidades de permisos o error de dominio
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   */
  async findAll(): Promise<PermissionEntity[] | DomainBaseError> {
    try {
      const permissions = await this.prisma.permission.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return PermissionEntity.toDomainList(permissions);
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, PERMISSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Recupera un permiso por su nombre único.
   *
   * @param name - Nombre del permiso (ej: 'user:read:all')
   * @returns Promesa con la entidad del permiso, null si no se encuentra, o error de dominio
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   */
  async findByName(name: string): Promise<PermissionEntity | null | DomainBaseError> {
    try {
      const permission = await this.prisma.permission.findUnique({
        where: { name },
      });

      return permission ? PermissionEntity.toDomain(permission) : null;
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, PERMISSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Recupera múltiples permisos por sus nombres.
   *
   * @param names - Array de nombres de permisos
   * @returns Promesa con el array de entidades de permisos encontrados o error de dominio
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   */
  async findByNames(names: string[]): Promise<PermissionEntity[] | DomainBaseError> {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: {
          name: {
            in: names,
          },
        },
      });

      return PermissionEntity.toDomainList(permissions);
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, PERMISSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Recupera todos los permisos asignados a un usuario específico.
   *
   * @param userId - Identificador del usuario
   * @returns Promesa con el array de entidades de permisos del usuario o error de dominio
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   */
  async findUserPermissions(userId: string): Promise<PermissionEntity[] | DomainBaseError> {
    try {
      this.logger.debug({ userId }, 'Finding user permissions');

      const userPermissions = await this.prisma.userPermission.findMany({
        where: { userId },
        include: {
          permission: true,
        },
      });

      const permissions = userPermissions.map((up) => up.permission);
      return PermissionEntity.toDomainList(permissions);
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, PERMISSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Asigna múltiples permisos a un usuario.
   *
   * @param userId - Identificador del usuario
   * @param permissionIds - Array de identificadores de permisos a asignar
   * @returns Promesa que resuelve cuando se completa la asignación o error de dominio
   * @throws DataBaseError cuando ocurre un fallo de persistencia
   * @throws NotFoundError si el usuario o algún permiso no existe
   */
  async assignPermissions(
    userId: string,
    permissionIds: string[],
  ): Promise<void | DomainBaseError> {
    try {
      this.logger.info({ userId, permissionIds }, 'Assigning permissions to user');

      // Crear registros de asignación (skipDuplicates ignora permisos ya asignados)
      await this.prisma.userPermission.createMany({
        data: permissionIds.map((permissionId) => ({
          userId,
          permissionId,
        })),
        skipDuplicates: true,
      });

      this.logger.info(
        { userId, count: permissionIds.length },
        'Permissions assigned successfully',
      );
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, PERMISSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Revoca múltiples permisos de un usuario.
   *
   * @param userId - Identificador del usuario
   * @param permissionIds - Array de identificadores de permisos a revocar
   * @returns Promesa que resuelve cuando se completa la revocación o error de dominio
   * @throws DataBaseError cuando ocurre un fallo de persistencia
   */
  async revokePermissions(
    userId: string,
    permissionIds: string[],
  ): Promise<void | DomainBaseError> {
    try {
      this.logger.info({ userId, permissionIds }, 'Revoking permissions from user');

      // Eliminar registros de asignación
      await this.prisma.userPermission.deleteMany({
        where: {
          userId,
          permissionId: {
            in: permissionIds,
          },
        },
      });

      this.logger.info({ userId, count: permissionIds.length }, 'Permissions revoked successfully');
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, PERMISSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Verifica si un usuario tiene un permiso específico asignado.
   *
   * @param userId - Identificador del usuario
   * @param permissionName - Nombre del permiso a verificar
   * @returns Promesa que resuelve a true si el usuario tiene el permiso, false si no, o error de dominio
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean | DomainBaseError> {
    try {
      const userPermission = await this.prisma.userPermission.findFirst({
        where: {
          userId,
          permission: {
            name: permissionName,
          },
        },
      });

      return userPermission !== null;
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, PERMISSION_ORM_ERROR_CONFIG);
    }
  }
}
