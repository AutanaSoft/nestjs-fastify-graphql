import type { Permission } from '@/shared/domain/types';

/**
 * Permisos del módulo de usuarios.
 *
 * @remarks
 * Define todos los permisos relacionados con la gestión de usuarios del sistema.
 * Estos permisos se combinan con otros permisos de módulos en INITIAL_PERMISSIONS.
 *
 * Sistema de 2 niveles:
 * - `user:action` - Permiso básico (recursos propios, validación en casos de uso)
 * - `user:action:all` - Permiso administrativo (todos los recursos, sin validación)
 * - `user:manage` - Gestión completa (todas las acciones sobre usuarios)
 *
 * @public
 */
export const USER_PERMISSIONS = [
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
] as const satisfies readonly Permission[];

/**
 * Tipo que extrae los nombres de los permisos de usuarios.
 *
 * @public
 */
export type UserPermissionName = (typeof USER_PERMISSIONS)[number]['name'];
