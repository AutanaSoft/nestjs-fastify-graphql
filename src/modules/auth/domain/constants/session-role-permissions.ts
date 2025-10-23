import type { SessionPermissionName } from './session-permissions';

/**
 * Define los permisos de sesión asignados a cada rol del sistema.
 *
 * Esta configuración determina qué operaciones relacionadas con sesiones puede
 * realizar cada rol. Los permisos siguen el principio de menor privilegio.
 *
 * @remarks
 * Jerarquía de roles (de mayor a menor privilegio):
 * - SUPER_ADMIN: Control total de sesiones
 * - ADMIN: Control total de sesiones
 * - MANAGER: Gestión de sesiones propias y de subordinados
 * - MODERATOR: Gestión de sesiones propias
 * - SUPPORT: Solo lectura de todas las sesiones
 * - USER: Solo lectura de sus propias sesiones
 * - GUEST: Sin permisos de sesión
 *
 * @example
 * ```typescript
 * import { SESSION_MODULE_ROLE_PERMISSIONS } from '@modules/auth/domain/constants';
 *
 * const adminPermissions = SESSION_MODULE_ROLE_PERMISSIONS['ADMIN'];
 * // ['session:manage']
 * ```
 */
export const SESSION_MODULE_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['session:manage'],
  ADMIN: ['session:manage'],
  MANAGER: ['session:read:all', 'session:create', 'session:delete:all'],
  MODERATOR: ['session:read:all', 'session:delete:all'],
  SUPPORT: ['session:read:all'],
  USER: ['session:read', 'session:create', 'session:delete'],
  GUEST: ['session:create'],
} as const satisfies Record<string, readonly SessionPermissionName[]>;
