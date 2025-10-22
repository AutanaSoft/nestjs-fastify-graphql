import { UserPermission as PrismaUserPermission } from '@prisma/client';

/**
 * Entidad de dominio que representa la asignación de un permiso a un usuario.
 *
 * @remarks
 * Esta entidad registra la relación entre un usuario y un permiso,
 * incluyendo cuándo fue otorgado el permiso.
 *
 * @public
 */
export class UserPermissionEntity {
  readonly id: string;
  readonly userId: string;
  readonly permissionId: string;
  readonly grantedAt: Date;

  private constructor(props: {
    id: string;
    userId: string;
    permissionId: string;
    grantedAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.permissionId = props.permissionId;
    this.grantedAt = props.grantedAt;
  }

  /**
   * Mapea un registro de Prisma a una entidad de dominio.
   *
   * @param userPermission - Registro de UserPermission de Prisma
   * @returns Entidad de dominio UserPermissionEntity
   *
   * @public
   */
  static toDomain(userPermission: PrismaUserPermission): UserPermissionEntity {
    return new UserPermissionEntity({
      id: userPermission.id,
      userId: userPermission.userId,
      permissionId: userPermission.permissionId,
      grantedAt: userPermission.grantedAt,
    });
  }

  /**
   * Mapea múltiples registros de Prisma a entidades de dominio.
   *
   * @param userPermissions - Array de registros de UserPermission de Prisma
   * @returns Array de entidades de dominio UserPermissionEntity
   *
   * @public
   */
  static toDomainList(userPermissions: PrismaUserPermission[]): UserPermissionEntity[] {
    return userPermissions.map((up) => UserPermissionEntity.toDomain(up));
  }
}
