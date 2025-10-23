import { Permission as PrismaPermission } from '@prisma/client';

/**
 * Entidad de dominio que representa un permiso del sistema.
 *
 * @remarks
 * Los permisos siguen el formato `resource:action:scope` donde:
 * - resource: Entidad del sistema (user, session, permission, etc.)
 * - action: Acción permitida (read, create, update, delete, manage)
 * - scope: Alcance del permiso (own, all) - opcional
 *
 * @public
 */
export class PermissionEntity {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Verifica si este permiso cubre el permiso requerido.
   *
   * @param required - Nombre del permiso requerido
   * @returns true si este permiso cubre el requerido
   *
   * @remarks
   * Reglas de matching:
   * - Coincidencia exacta: 'user:read' cubre 'user:read'
   * - Manage cubre todas las acciones: 'user:manage' cubre 'user:read:all', 'user:update:all', etc.
   * - El permiso básico NO cubre el administrativo: 'user:read' NO cubre 'user:read:all'
   * - El permiso administrativo NO cubre el básico: 'user:read:all' NO cubre 'user:read'
   *
   * @example
   * ```typescript
   * const permission = PermissionEntity.toDomain({ name: 'user:manage', ... });
   * permission.covers('user:read:all'); // true
   * permission.covers('user:update'); // true
   * permission.covers('session:read:all'); // false
   * ```
   */
  covers(required: string): boolean {
    // Coincidencia exacta
    if (this.name === required) {
      return true;
    }

    // Extraer partes del permiso actual
    const [currentResource, currentAction] = this.name.split(':');
    const [requiredResource] = required.split(':');

    // Recursos diferentes = no cubre
    if (currentResource !== requiredResource) {
      return false;
    }

    // Si el permiso actual es 'manage', cubre cualquier acción del mismo recurso
    if (currentAction === 'manage') {
      return true;
    }

    return false;
  }

  /**
   * Extrae el recurso del nombre del permiso.
   *
   * @returns El nombre del recurso (ej: 'user', 'session', 'permission')
   *
   * @example
   * ```typescript
   * const permission = PermissionEntity.toDomain({ name: 'user:read:all', ... });
   * permission.getResource(); // 'user'
   * ```
   */
  getResource(): string {
    return this.name.split(':')[0];
  }

  /**
   * Extrae la acción del nombre del permiso.
   *
   * @returns El nombre de la acción (ej: 'read', 'create', 'update', 'delete', 'manage')
   *
   * @example
   * ```typescript
   * const permission = PermissionEntity.toDomain({ name: 'user:read:all', ... });
   * permission.getAction(); // 'read'
   * ```
   */
  getAction(): string {
    return this.name.split(':')[1];
  }

  /**
   * Extrae el alcance del nombre del permiso.
   *
   * @returns El alcance del permiso ('own', 'all') o undefined si no tiene
   *
   * @example
   * ```typescript
   * const permission1 = PermissionEntity.toDomain({ name: 'user:read:all', ... });
   * permission1.getScope(); // 'all'
   *
   * const permission2 = PermissionEntity.toDomain({ name: 'permission:read', ... });
   * permission2.getScope(); // undefined
   * ```
   */
  getScope(): 'own' | 'all' | undefined {
    const parts = this.name.split(':');
    const scope = parts[2];
    return scope === 'own' || scope === 'all' ? scope : undefined;
  }

  /**
   * Mapea un registro de Prisma a una entidad de dominio.
   *
   * @param permission - Registro de Permission de Prisma
   * @returns Entidad de dominio PermissionEntity
   *
   * @public
   */
  static toDomain(permission: PrismaPermission): PermissionEntity {
    return new PermissionEntity({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }

  /**
   * Mapea múltiples registros de Prisma a entidades de dominio.
   *
   * @param permissions - Array de registros de Permission de Prisma
   * @returns Array de entidades de dominio PermissionEntity
   *
   * @public
   */
  static toDomainList(permissions: PrismaPermission[]): PermissionEntity[] {
    return permissions.map((permission) => PermissionEntity.toDomain(permission));
  }
}
