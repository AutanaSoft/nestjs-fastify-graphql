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
 * Formato de nombres: `resource:action:scope`
 * - resource: Entidad o recurso del sistema (user, permission, session, etc.)
 * - action: Acción sobre el recurso (read, create, update, delete, manage)
 * - scope: Alcance del permiso (own, all) - opcional
 *
 * Jerarquía de alcances:
 * - own: Opera solo sobre recursos propios del usuario
 * - all: Opera sobre recursos de cualquier usuario
 *
 * Jerarquía de acciones:
 * - read: Ver y listar recursos
 * - create: Crear nuevos recursos
 * - update: Modificar recursos existentes
 * - delete: Eliminar recursos
 * - manage: Control total (incluye todas las acciones anteriores)
 *
 * @public
 */
export const INITIAL_PERMISSIONS = [
  // === PERMISOS DE USUARIOS ===
  // Lectura
  {
    name: 'user:read:own',
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
    name: 'user:update:own',
    description: 'Update own user profile',
  },
  {
    name: 'user:update:all',
    description: 'Update any user',
  },
  // Eliminación
  {
    name: 'user:delete:own',
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
    name: 'session:read:own',
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
    name: 'session:delete:own',
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
