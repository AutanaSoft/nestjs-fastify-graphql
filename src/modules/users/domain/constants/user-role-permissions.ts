import type { UserPermissionName } from './user-permissions';

/**
 * Asignación de permisos de usuarios por rol.
 *
 * @remarks
 * Define qué permisos del módulo de usuarios tiene cada rol del sistema.
 * Esta configuración se combina con las de otros módulos para formar
 * la estructura completa ROLE_PERMISSIONS.
 *
 * Jerarquía de roles (de mayor a menor privilegio):
 * - SUPER_ADMIN: Gestión total de usuarios
 * - ADMIN: Gestión total de usuarios
 * - MANAGER: Lectura total, creación y actualización de usuarios
 * - MODERATOR: Lectura total y actualización de usuarios
 * - SUPPORT: Solo lectura de todos los usuarios
 * - USER: Solo lectura y actualización de su propio perfil
 * - GUEST: Sin permisos sobre usuarios
 *
 * @public
 */
export const USER_MODULE_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['user:manage'],
  ADMIN: ['user:manage'],
  MANAGER: ['user:read:all', 'user:create', 'user:update:all'],
  MODERATOR: ['user:read:all', 'user:update:all'],
  SUPPORT: ['user:read:all'],
  USER: ['user:read', 'user:update'],
  GUEST: [],
} as const satisfies Record<string, readonly UserPermissionName[]>;
