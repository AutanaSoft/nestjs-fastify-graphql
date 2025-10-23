import type { Permission } from '@/shared/domain/types';
import { SESSION_PERMISSIONS } from '@/modules/auth/domain/constants';
import { USER_PERMISSIONS } from '@/modules/users/domain/constants';

import { SYSTEM_PERMISSIONS } from './system-permissions';

/**
 * Permisos iniciales del sistema consolidados desde todos los módulos.
 *
 * @remarks
 * Este archivo consolida los permisos definidos en cada módulo para facilitar
 * la inicialización de la base de datos mediante seeds o migraciones.
 *
 * Arquitectura descentralizada:
 * - Cada módulo define sus propios permisos en su dominio
 * - Este archivo importa y combina todos los permisos
 * - Se utiliza solo durante seed/migraciones, no en runtime
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
 * Para agregar permisos de un nuevo módulo:
 * 1. Crear archivo de permisos en el módulo: src/modules/{module}/domain/constants/{module}-permissions.ts
 * 2. Importar y agregar al array INITIAL_PERMISSIONS en este archivo
 *
 * @public
 */
export const INITIAL_PERMISSIONS = [
  ...USER_PERMISSIONS,
  ...SESSION_PERMISSIONS,
  ...SYSTEM_PERMISSIONS,
] as const satisfies readonly Permission[];

/**
 * Tipo que extrae los nombres de los permisos iniciales.
 * Útil para validación en tiempo de compilación.
 *
 * @public
 */
export type PermissionName = (typeof INITIAL_PERMISSIONS)[number]['name'];
