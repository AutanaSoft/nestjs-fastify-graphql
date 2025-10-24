import { DomainBaseError } from '@/shared/domain/errors';
import { PermissionEntity } from '../entities';

/**
 * Repository port para operaciones de persistencia de permisos.
 *
 * Este contrato abstrae el acceso a datos del dominio de permisos y debe ser
 * implementado por adaptadores de infraestructura (ej: TypeORM, Prisma) para mantener
 * la capa de dominio agnóstica del framework.
 *
 * @remarks
 * Las implementaciones deben mapear errores de infraestructura a errores de dominio/aplicación
 * cuando sea apropiado y no deben filtrar tipos específicos del ORM a la capa de dominio.
 *
 * @public
 */
export abstract class PermissionRepository {
  /**
   * Recupera todos los permisos disponibles en el sistema.
   *
   * @returns Promesa que resuelve al array de {@link PermissionEntity}
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   */
  abstract findAll(): Promise<PermissionEntity[] | DomainBaseError>;

  /**
   * Recupera un permiso por su nombre único.
   *
   * @param name - Nombre del permiso (ej: 'user:read:all')
   * @returns Promesa que resuelve a {@link PermissionEntity} si se encuentra; de lo contrario `null`
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   */
  abstract findByName(name: string): Promise<PermissionEntity | null | DomainBaseError>;

  /**
   * Recupera múltiples permisos por sus nombres.
   *
   * @param names - Array de nombres de permisos
   * @returns Promesa que resuelve al array de {@link PermissionEntity} encontrados
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   * @remarks Los permisos no encontrados simplemente no estarán en el resultado
   */
  abstract findByNames(names: string[]): Promise<PermissionEntity[] | DomainBaseError>;

  /**
   * Recupera todos los permisos asignados a un usuario específico.
   *
   * @param userId - Identificador del usuario
   * @returns Promesa que resuelve al array de {@link PermissionEntity} del usuario
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   * @remarks Incluye solo permisos asignados explícitamente, no los del rol base
   */
  abstract findUserPermissions(userId: string): Promise<PermissionEntity[] | DomainBaseError>;

  /**
   * Asigna múltiples permisos a un usuario.
   *
   * @param userId - Identificador del usuario
   * @param permissionIds - Array de identificadores de permisos a asignar
   * @returns Promesa que resuelve cuando se completa la asignación
   * @throws DataBaseError cuando ocurre un fallo de persistencia
   * @throws NotFoundError si el usuario o algún permiso no existe
   * @remarks Los permisos duplicados son ignorados (skipDuplicates)
   */
  abstract assignPermissions(
    userId: string,
    permissionIds: string[],
  ): Promise<void | DomainBaseError>;

  /**
   * Revoca múltiples permisos de un usuario.
   *
   * @param userId - Identificador del usuario
   * @param permissionIds - Array de identificadores de permisos a revocar
   * @returns Promesa que resuelve cuando se completa la revocación
   * @throws DataBaseError cuando ocurre un fallo de persistencia
   * @remarks Los permisos no asignados son ignorados silenciosamente
   */
  abstract revokePermissions(
    userId: string,
    permissionIds: string[],
  ): Promise<void | DomainBaseError>;

  /**
   * Verifica si un usuario tiene un permiso específico asignado.
   *
   * @param userId - Identificador del usuario
   * @param permissionName - Nombre del permiso a verificar
   * @returns Promesa que resuelve a `true` si el usuario tiene el permiso; de lo contrario `false`
   * @throws DataBaseError cuando ocurre un fallo al consultar datos
   * @remarks Verifica solo permisos asignados explícitamente, no los del rol base
   */
  abstract hasPermission(
    userId: string,
    permissionName: string,
  ): Promise<boolean | DomainBaseError>;
}

/**
 * Token de inyección para el repositorio de permisos.
 */
export const PERMISSION_REPOSITORY = Symbol('PermissionRepository');
