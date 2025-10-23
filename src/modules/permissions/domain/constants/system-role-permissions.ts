import type { SystemPermissionName } from './system-permissions';

/**
 * Define los permisos del sistema asignados a cada rol.
 *
 * Esta configuración determina qué operaciones de administración del sistema,
 * gestión de permisos y configuración puede realizar cada rol. Estos son los
 * permisos de más alto nivel y deben asignarse cuidadosamente.
 *
 * @remarks
 * Jerarquía de roles para permisos del sistema:
 * - SUPER_ADMIN: Control total (permission:manage, settings:manage, admin:*, system:*)
 * - ADMIN: Control total (igual a SUPER_ADMIN)
 * - MANAGER: Lectura de configuración y permisos, acceso al panel de admin
 * - MODERATOR: Lectura de configuración
 * - SUPPORT: Sin permisos del sistema
 * - USER: Sin permisos del sistema
 * - GUEST: Sin permisos del sistema
 *
 * Categorías de permisos del sistema:
 * - permission:*: Gestión de permisos y asignaciones de roles
 * - settings:*: Gestión de configuración del sistema
 * - admin:*: Operaciones administrativas generales
 * - system:*: Operaciones de sistema (backup, restore, monitor)
 *
 * @example
 * ```typescript
 * import { SYSTEM_MODULE_ROLE_PERMISSIONS } from '@modules/permissions/domain/constants';
 *
 * const adminPermissions = SYSTEM_MODULE_ROLE_PERMISSIONS['ADMIN'];
 * // ['permission:manage', 'settings:manage', 'admin:access', 'admin:audit', 'system:backup', 'system:restore', 'system:monitor']
 * ```
 */
export const SYSTEM_MODULE_ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'permission:manage',
    'settings:manage',
    'admin:access',
    'admin:audit',
    'system:backup',
    'system:restore',
    'system:monitor',
  ],
  ADMIN: [
    'permission:manage',
    'settings:manage',
    'admin:access',
    'admin:audit',
    'system:backup',
    'system:restore',
    'system:monitor',
  ],
  MANAGER: ['permission:read', 'settings:read', 'admin:access'],
  MODERATOR: ['permission:read', 'settings:read'],
  SUPPORT: ['permission:read', 'settings:read', 'admin:audit'],
  USER: ['permission:read'],
  GUEST: [],
} as const satisfies Record<string, readonly SystemPermissionName[]>;
