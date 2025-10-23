import type { Permission } from '@/shared/domain/types';

/**
 * Permisos del sistema (permissions, settings, admin, system).
 *
 * @remarks
 * Define todos los permisos relacionados con la gestión del sistema, configuración
 * y administración. Estos son permisos propios del módulo de permisos y funciones
 * administrativas del sistema.
 *
 * Estos permisos se combinan con otros permisos de módulos en INITIAL_PERMISSIONS.
 *
 * @public
 */
export const SYSTEM_PERMISSIONS = [
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
 * Tipo que extrae los nombres de los permisos del sistema.
 *
 * @public
 */
export type SystemPermissionName = (typeof SYSTEM_PERMISSIONS)[number]['name'];
