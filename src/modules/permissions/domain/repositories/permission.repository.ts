import { DomainBaseError } from '@/shared/domain/errors';
import { PermissionEntity } from '../entities';

/**
 * Contrato del repositorio para operaciones de persistencia de permisos.
 *
 * Define el puerto de dominio que abstrae el acceso a datos relacionados con permisos.
 * Las implementaciones concretas deben residir en la capa de infraestructura como adaptadores
 * (ej: TypeORM, Prisma) para mantener el dominio libre de dependencias del framework.
 *
 * @remarks
 * - Las implementaciones deben mapear errores de infraestructura a {@link DomainBaseError}
 * - No deben filtrarse tipos específicos del ORM a la capa de dominio
 * - Retorna union types con {@link DomainBaseError} para manejo explícito de errores
 *
 * @public
 */
export abstract class PermissionRepository {
  /**
   * Recupera todos los permisos disponibles en el sistema.
   *
   * @returns Array de entidades de permisos o error de dominio
   * @throws {DataBaseError} Cuando falla la consulta a la base de datos
   */
  abstract findAll(): Promise<PermissionEntity[] | DomainBaseError>;

  /**
   * Busca un permiso por su nombre único.
   *
   * @param name - Nombre del permiso (ej: 'user:read:all')
   * @returns Entidad del permiso si existe, null si no se encuentra, o error de dominio
   * @throws {DataBaseError} Cuando falla la consulta a la base de datos
   */
  abstract findByName(name: string): Promise<PermissionEntity | null | DomainBaseError>;

  /**
   * Recupera múltiples permisos por sus nombres.
   *
   * @param names - Array de nombres de permisos a buscar
   * @returns Array de entidades encontradas o error de dominio
   * @throws {DataBaseError} Cuando falla la consulta a la base de datos
   * @remarks Los permisos no encontrados simplemente no aparecen en el resultado
   */
  abstract findByNames(names: string[]): Promise<PermissionEntity[] | DomainBaseError>;

  /**
   * Obtiene todos los permisos asignados explícitamente a un usuario.
   *
   * @param userId - Identificador único del usuario
   * @returns Array de permisos del usuario o error de dominio
   * @throws {DataBaseError} Cuando falla la consulta a la base de datos
   * @remarks No incluye permisos heredados del rol base, solo asignaciones directas
   */
  abstract findUserPermissions(userId: string): Promise<PermissionEntity[] | DomainBaseError>;

  /**
   * Asigna un conjunto de permisos a un usuario.
   *
   * @param userId - Identificador único del usuario
   * @param permissionIds - Array de identificadores de permisos a asignar
   * @returns void si tiene éxito o error de dominio
   * @throws {DataBaseError} Cuando falla la operación de persistencia
   * @throws {NotFoundError} Si el usuario o algún permiso no existe
   * @remarks Ignora permisos ya asignados (skipDuplicates)
   */
  abstract assignPermissions(
    userId: string,
    permissionIds: string[],
  ): Promise<void | DomainBaseError>;

  /**
   * Revoca un conjunto de permisos de un usuario.
   *
   * @param userId - Identificador único del usuario
   * @param permissionIds - Array de identificadores de permisos a revocar
   * @returns void si tiene éxito o error de dominio
   * @throws {DataBaseError} Cuando falla la operación de persistencia
   * @remarks Ignora silenciosamente permisos que no estaban asignados
   */
  abstract revokePermissions(
    userId: string,
    permissionIds: string[],
  ): Promise<void | DomainBaseError>;

  /**
   * Verifica si un usuario tiene un permiso específico asignado.
   *
   * @param userId - Identificador único del usuario
   * @param permissionName - Nombre del permiso a verificar
   * @returns true si el usuario tiene el permiso, false en caso contrario, o error de dominio
   * @throws {DataBaseError} Cuando falla la consulta a la base de datos
   * @remarks Solo verifica permisos asignados directamente, no los heredados del rol
   */
  abstract hasPermission(
    userId: string,
    permissionName: string,
  ): Promise<boolean | DomainBaseError>;
}

/**
 * Token de inyección de dependencias para el repositorio de permisos.
 *
 * @remarks
 * Utilice este símbolo para inyectar implementaciones del {@link PermissionRepository}
 * en constructores de casos de uso o servicios de aplicación.
 */
export const PERMISSION_REPOSITORY = Symbol('PermissionRepository');
