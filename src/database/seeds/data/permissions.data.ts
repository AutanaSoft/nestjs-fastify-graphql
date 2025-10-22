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
 */
export type PermissionName = (typeof INITIAL_PERMISSIONS)[number]['name'];

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
 * Valida que todos los permisos referenciados en ROLE_PERMISSIONS
 * existan en INITIAL_PERMISSIONS.
 *
 * @param rolePermissions Mapeo de roles a permisos a validar.
 * @returns Objeto con permisos faltantes por rol (vacío si todo es válido).
 */
export function validateRolePermissions(
  rolePermissions: Record<string, readonly string[]>,
): Record<string, string[]> {
  const validPermissions = new Set<string>(INITIAL_PERMISSIONS.map((p) => p.name));
  const missingByRole: Record<string, string[]> = {};

  for (const [role, permissions] of Object.entries(rolePermissions)) {
    const missing = permissions.filter((p) => !validPermissions.has(p));
    if (missing.length > 0) {
      missingByRole[role] = [...missing];
    }
  }

  return missingByRole;
}
