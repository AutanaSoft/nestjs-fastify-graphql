import type { PermissionName } from './initial-permissions';

/**
 * Mapeo de roles a permisos predeterminados.
 *
 * Estos permisos se asignarán automáticamente al crear usuarios con estos roles.
 * Todos los nombres de permisos deben existir en INITIAL_PERMISSIONS.
 *
 * @remarks
 * Jerarquía de roles (de mayor a menor privilegio):
 * - SUPER_ADMIN: Acceso total y sin restricciones al sistema completo
 * - ADMIN: Gestión completa de usuarios, permisos y configuración
 * - MANAGER: Gestión de usuarios y visualización de auditoría
 * - MODERATOR: Moderación de contenido y gestión limitada de usuarios
 * - SUPPORT: Soporte a usuarios, lectura de información y auditoría
 * - USER: Permisos básicos de lectura y gestión de recursos propios
 * - GUEST: Permisos mínimos, solo puede iniciar sesión
 *
 * @public
 */
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    // Gestión total de usuarios
    'user:manage',
    // Gestión total de permisos
    'permission:manage',
    // Gestión total de sesiones
    'session:manage',
    // Configuración del sistema
    'settings:manage',
    // Acceso administrativo
    'admin:access',
    'admin:audit',
    // Operaciones de sistema
    'system:backup',
    'system:restore',
    'system:monitor',
  ],
  ADMIN: [
    // Gestión total de usuarios
    'user:manage',
    // Gestión total de permisos
    'permission:manage',
    // Gestión total de sesiones
    'session:manage',
    // Configuración del sistema
    'settings:manage',
    // Acceso administrativo
    'admin:access',
    'admin:audit',
    // Monitoreo del sistema
    'system:monitor',
  ],
  MANAGER: [
    // Gestión de usuarios (sin eliminación total)
    'user:read:all',
    'user:create',
    'user:update:all',
    // Lectura de permisos
    'permission:read',
    // Gestión de sesiones
    'session:read:all',
    'session:delete:all',
    // Auditoría
    'admin:audit',
    // Configuración de lectura
    'settings:read',
  ],
  MODERATOR: [
    // Lectura y actualización limitada de usuarios
    'user:read:all',
    'user:update:all',
    // Lectura de permisos
    'permission:read',
    // Gestión de sesiones
    'session:read:all',
    'session:delete:all',
    // Lectura de configuración
    'settings:read',
  ],
  SUPPORT: [
    // Lectura de usuarios
    'user:read:all',
    // Lectura de permisos
    'permission:read',
    // Lectura de sesiones
    'session:read:all',
    // Auditoría
    'admin:audit',
    // Lectura de configuración
    'settings:read',
  ],
  USER: [
    // Solo puede ver y modificar su propio perfil
    'user:read:own',
    'user:update:own',
    // Puede gestionar sus propias sesiones
    'session:read:own',
    'session:create',
    'session:delete:own',
    // Puede ver permisos disponibles
    'permission:read',
  ],
  GUEST: [
    // Solo puede iniciar sesión
    'session:create',
  ],
} as const satisfies Record<string, readonly PermissionName[]>;

/**
 * Tipo que representa los roles disponibles en el sistema.
 *
 * @public
 */
export type RoleName = keyof typeof ROLE_PERMISSIONS;
