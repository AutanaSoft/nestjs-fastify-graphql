import type { Permission } from '@/shared/domain/types';

/**
 * Permisos del módulo de autenticación y sesiones.
 *
 * @remarks
 * Define todos los permisos relacionados con la gestión de sesiones y autenticación.
 * Estos permisos se combinan con otros permisos de módulos en INITIAL_PERMISSIONS.
 *
 * Sistema de 2 niveles:
 * - `session:action` - Permiso básico (sesiones propias, validación en casos de uso)
 * - `session:action:all` - Permiso administrativo (todas las sesiones, sin validación)
 * - `session:manage` - Gestión completa (todas las acciones sobre sesiones)
 *
 * @public
 */
export const SESSION_PERMISSIONS = [
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
] as const satisfies readonly Permission[];

/**
 * Tipo que extrae los nombres de los permisos de sesiones.
 *
 * @public
 */
export type SessionPermissionName = (typeof SESSION_PERMISSIONS)[number]['name'];
