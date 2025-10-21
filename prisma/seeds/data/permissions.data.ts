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
 * Formato de nombres: `resource:action`
 * - resource: Entidad o recurso del sistema (user, permission, session, etc.)
 * - action: Acción sobre el recurso (read, write, delete, manage)
 *
 * Jerarquía de acciones:
 * - read: Ver y listar recursos
 * - write: Crear y actualizar recursos
 * - delete: Eliminar recursos
 * - manage: Control total (incluye read, write y delete)
 */
export const INITIAL_PERMISSIONS = [
  // Permisos de usuarios
  {
    name: 'user:read',
    description: 'View and list users',
  },
  {
    name: 'user:write',
    description: 'Create and update users',
  },
  {
    name: 'user:delete',
    description: 'Delete users',
  },
  {
    name: 'user:manage',
    description: 'Full control over users (includes all user permissions)',
  },
  // Permisos de permisos
  {
    name: 'permission:read',
    description: 'View and list permissions',
  },
  {
    name: 'permission:write',
    description: 'Create and update permissions',
  },
  {
    name: 'permission:delete',
    description: 'Delete permissions',
  },
  {
    name: 'permission:manage',
    description: 'Full control over permissions',
  },
  // Permisos de sesiones
  {
    name: 'session:read',
    description: 'View active sessions',
  },
  {
    name: 'session:write',
    description: 'Create sessions (login)',
  },
  {
    name: 'session:delete',
    description: 'Revoke sessions (logout)',
  },
  {
    name: 'session:manage',
    description: 'Full control over sessions',
  },
  // Permisos de configuración
  {
    name: 'settings:read',
    description: 'View system settings',
  },
  {
    name: 'settings:manage',
    description: 'Modify system settings',
  },
  // Permisos de administración
  {
    name: 'admin:access',
    description: 'Access admin panel',
  },
  {
    name: 'admin:audit',
    description: 'View audit logs and system activity',
  },
  // Permisos de sistema
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
 * - ADMIN: Acceso total a todas las funcionalidades del sistema
 * - USER: Permisos básicos de lectura y gestión de sesiones propias
 * - GUEST: Permisos mínimos, solo puede iniciar sesión
 */
export const ROLE_PERMISSIONS = {
  ADMIN: [
    // Acceso total
    'user:manage',
    'permission:manage',
    'session:manage',
    'settings:manage',
    'admin:access',
    'admin:audit',
    'system:backup',
    'system:restore',
    'system:monitor',
  ],
  USER: [
    // Permisos básicos de lectura
    'user:read',
    'session:read',
    'session:write',
    'session:delete',
  ],
  GUEST: [
    // Permisos mínimos
    'session:write', // Solo login
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
    const missing = permissions.filter((p) => !validPermissions.has(p as string));
    if (missing.length > 0) {
      missingByRole[role] = [...missing];
    }
  }

  return missingByRole;
}
