/**
 * Estructura de un permiso del sistema.
 */
export interface Permission {
  name: string;
  description: string;
}

/**
 * Permisos iniciales del sistema.
 *
 * Sistema de permisos de 2 niveles:
 *
 * Formato básico: `resource:action`
 * - Implica acceso a recursos propios del usuario
 * - La validación de propiedad se realiza en los casos de uso
 * - Ejemplos: user:read, user:update, session:delete
 *
 * Formato administrativo: `resource:action:all`
 * - Permite acceso a todos los recursos sin restricción de propiedad
 * - Solo para roles administrativos
 * - Ejemplos: user:read:all, user:update:all, session:delete:all
 *
 * Formato de gestión: `resource:manage`
 * - Control total sobre el recurso (todas las acciones)
 * - Nivel más alto de privilegios para un recurso específico
 * - Ejemplos: user:manage, session:manage, permission:manage
 *
 * Componentes:
 * - resource: Entidad o recurso del sistema (user, permission, session, etc.)
 * - action: Acción sobre el recurso (read, create, update, delete, manage)
 * - scope: Alcance administrativo (all) - opcional, solo para acceso sin restricciones
 *
 * @public
 */
export const INITIAL_PERMISSIONS = [
  // === PERMISOS DE USUARIOS ===
  // Lectura
  {
    name: 'user:read',
    description: 'View own user profile',
  },
  {
    name: 'user:read:all',
    description: 'View all users',
  },
  // Creación
  {
    name: 'user:create',
    description: 'Create new users',
  },
  // Actualización
  {
    name: 'user:update',
    description: 'Update own user profile',
  },
  {
    name: 'user:update:all',
    description: 'Update any user',
  },
  // Eliminación
  {
    name: 'user:delete',
    description: 'Delete own account',
  },
  {
    name: 'user:delete:all',
    description: 'Delete any user',
  },
  // Gestión completa
  {
    name: 'user:manage',
    description: 'Full user management (includes all user:* permissions)',
  },

  // === PERMISOS DE SESIONES ===
  // Lectura
  {
    name: 'session:read',
    description: 'View own active sessions',
  },
  {
    name: 'session:read:all',
    description: 'View all user sessions',
  },
  // Creación
  {
    name: 'session:create',
    description: 'Create sessions (login)',
  },
  // Eliminación
  {
    name: 'session:delete',
    description: 'Revoke own sessions (logout)',
  },
  {
    name: 'session:delete:all',
    description: 'Revoke any user sessions',
  },
  // Gestión completa
  {
    name: 'session:manage',
    description: 'Full session management (includes all session:* permissions)',
  },

  // === PERMISOS DE PERMISOS ===
  {
    name: 'permission:read',
    description: 'View available permissions',
  },
  {
    name: 'permission:assign',
    description: 'Assign permissions to users',
  },
  {
    name: 'permission:revoke',
    description: 'Revoke permissions from users',
  },
  {
    name: 'permission:manage',
    description: 'Full permission management',
  },

  // === PERMISOS DE CONFIGURACIÓN ===
  {
    name: 'settings:read',
    description: 'View system settings',
  },
  {
    name: 'settings:manage',
    description: 'Modify system settings',
  },

  // === PERMISOS DE ADMINISTRACIÓN ===
  {
    name: 'admin:access',
    description: 'Access admin panel',
  },
  {
    name: 'admin:audit',
    description: 'View audit logs and system activity',
  },

  // === PERMISOS DE SISTEMA ===
  {
    name: 'system:backup',
    description: 'Create system backups',
  },
  {
    name: 'system:restore',
    description: 'Restore system from backups',
  },
  {
    name: 'system:monitor',
    description: 'Monitor system health and performance',
  },
] as const satisfies readonly Permission[];

/**
 * Tipo que extrae los nombres de los permisos iniciales.
 * Útil para validación en tiempo de compilación.
 *
 * @public
 */
export type PermissionName = (typeof INITIAL_PERMISSIONS)[number]['name'];
