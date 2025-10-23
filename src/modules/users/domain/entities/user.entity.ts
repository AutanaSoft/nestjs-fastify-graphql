import { User } from '@prisma/client';
import { UserRole, UserStatus } from '../enums/user.enum';

/**
 * Datos necesarios para reconstruir una entidad User desde persistencia.
 *
 * @remarks
 * Este tipo se utiliza internamente en el constructor privado para garantizar
 * que todas las propiedades requeridas estén presentes al crear una instancia.
 */
export type UserEntityData = {
  readonly id: string;
  readonly email: string;
  readonly userName: string;
  readonly password: string;
  readonly status: UserStatus;
  readonly role: UserRole;
  readonly emailVerified: Date | null;
  readonly permissions: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

/**
 * Entidad de dominio que representa un usuario del sistema.
 *
 * Encapsula los datos y el comportamiento de un usuario, manteniendo la lógica
 * de dominio pura y desacoplada de la infraestructura.
 *
 * @remarks
 * Esta entidad es inmutable por diseño. Todas las propiedades son de solo lectura
 * y la construcción se realiza a través de métodos estáticos que validan y mapean
 * los datos desde la capa de persistencia.
 *
 * @public
 */
export class UserEntity {
  readonly id: string;
  readonly email: string;
  readonly userName: string;
  readonly password: string;
  readonly status: UserStatus;
  readonly role: UserRole;
  readonly emailVerified: Date | null;
  readonly permissions: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  /**
   * Constructor privado que garantiza la creación controlada de instancias.
   *
   * @param data - Datos completos y validados del usuario
   *
   * @remarks
   * El constructor es privado para forzar el uso de métodos de fábrica estáticos
   * que se encargan de la validación y mapeo correcto desde la capa de persistencia.
   */
  private constructor(data: UserEntityData) {
    this.id = data.id;
    this.email = data.email;
    this.userName = data.userName;
    this.password = data.password;
    this.status = data.status;
    this.role = data.role;
    this.emailVerified = data.emailVerified;
    this.permissions = data.permissions;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Crea una instancia de UserEntity a partir de un modelo de Prisma con permisos.
   *
   * Reconstruye la entidad de dominio mapeando los datos desde el modelo de
   * persistencia, garantizando que los enums y tipos sean correctos.
   *
   * @param user - Modelo de usuario de Prisma con relación de permisos incluida
   * @returns Nueva instancia inmutable de UserEntity
   *
   * @remarks
   * Este método es utilizado por los adaptadores de infraestructura para
   * transformar los datos de la base de datos en entidades de dominio puras.
   */
  static toDomain(user: User & { permissions: string[] }): UserEntity {
    return new UserEntity({
      id: user.id,
      email: user.email,
      userName: user.userName,
      password: user.password,
      status: this.mapStatusToDomain(user.status),
      role: this.mapRoleToDomain(user.role),
      emailVerified: user.emailVerified,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * Convierte un array de modelos de Prisma con permisos en entidades de dominio.
   *
   * Aplica la transformación `toDomain` a cada elemento del array, facilitando
   * la conversión de listas de resultados de persistencia.
   *
   * @param prismaUsers - Array de modelos de usuario de Prisma con permisos incluidos
   * @returns Array de entidades de dominio UserEntity
   */
  static toDomainList(prismaUsers: (User & { permissions: string[] })[]): UserEntity[] {
    return prismaUsers.map((user) => this.toDomain(user));
  }

  /**
   * Mapea el estado de usuario desde Prisma al enum del dominio.
   *
   * @param status - Estado de usuario en formato Prisma
   * @returns Estado de usuario como enum de dominio UserStatus
   *
   * @remarks
   * Realiza un cast seguro ya que los valores de Prisma coinciden con
   * los valores del enum de dominio.
   */
  private static mapStatusToDomain(status: User['status']): UserStatus {
    return status as unknown as UserStatus;
  }

  /**
   * Mapea el rol de usuario desde Prisma al enum del dominio.
   *
   * @param role - Rol de usuario en formato Prisma
   * @returns Rol de usuario como enum de dominio UserRole
   *
   * @remarks
   * Realiza un cast seguro ya que los valores de Prisma coinciden con
   * los valores del enum de dominio.
   */
  private static mapRoleToDomain(role: User['role']): UserRole {
    return role as unknown as UserRole;
  }

  /**
   * Verifica si el usuario tiene un permiso específico.
   *
   * @param permission - Nombre del permiso a verificar (ej: 'user:update:all')
   * @returns true si el usuario tiene el permiso, false en caso contrario
   *
   * @remarks
   * Útil para validaciones condicionales en casos de uso, por ejemplo para
   * verificar si el usuario tiene permisos administrativos (:all) antes de
   * validar la propiedad de un recurso.
   *
   * @example
   * ```typescript
   * if (!currentUser.hasPermission('user:update:all')) {
   *   // Usuario no tiene permiso :all, validar propiedad
   *   this.ownershipService.validateOwnership(resource, currentUser, 'user');
   * }
   * ```
   */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}
