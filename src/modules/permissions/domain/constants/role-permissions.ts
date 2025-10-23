import { USER_MODULE_ROLE_PERMISSIONS } from '@modules/users/domain/constants';
import { SESSION_MODULE_ROLE_PERMISSIONS } from '@modules/auth/domain/constants';
import { mergeRolePermissions } from '../utils';
import type { PermissionName } from './initial-permissions';
import { SYSTEM_MODULE_ROLE_PERMISSIONS } from './system-role-permissions';

/**
 * Mapeo consolidado de roles a permisos predeterminados.
 *
 * Este archivo combina los permisos de todos los módulos del sistema usando la
 * función `mergeRolePermissions()`. Los permisos se definen de forma descentralizada
 * en cada módulo y se consolidan aquí para facilitar el acceso y el seeding.
 *
 * @remarks
 * **Arquitectura descentralizada**:
 * - Cada módulo define sus propios permisos de rol en `{module}-role-permissions.ts`
 * - Este archivo los consolida automáticamente eliminando duplicados
 * - Para agregar permisos de un nuevo módulo, importar su configuración y agregarlo al array
 *
 * **Jerarquía de roles** (de mayor a menor privilegio):
 * - SUPER_ADMIN: Acceso total y sin restricciones al sistema completo
 * - ADMIN: Gestión completa de usuarios, permisos y configuración
 * - MANAGER: Gestión de usuarios y visualización de auditoría
 * - MODERATOR: Moderación de contenido y gestión limitada de usuarios
 * - SUPPORT: Soporte a usuarios, lectura de información y auditoría
 * - USER: Permisos básicos de lectura y gestión de recursos propios
 * - GUEST: Permisos mínimos, solo puede iniciar sesión
 *
 * @example
 * Agregar permisos de un nuevo módulo:
 * ```typescript
 * import { PRODUCT_MODULE_ROLE_PERMISSIONS } from '@modules/products/domain/constants';
 *
 * export const ROLE_PERMISSIONS = mergeRolePermissions([
 *   USER_MODULE_ROLE_PERMISSIONS,
 *   SESSION_MODULE_ROLE_PERMISSIONS,
 *   SYSTEM_MODULE_ROLE_PERMISSIONS,
 *   PRODUCT_MODULE_ROLE_PERMISSIONS, // ← Agregar aquí
 * ]) satisfies Record<string, readonly PermissionName[]>;
 * ```
 *
 * @public
 */
export const ROLE_PERMISSIONS = mergeRolePermissions([
  USER_MODULE_ROLE_PERMISSIONS,
  SESSION_MODULE_ROLE_PERMISSIONS,
  SYSTEM_MODULE_ROLE_PERMISSIONS,
]) satisfies Record<string, readonly PermissionName[]>;

/**
 * Tipo que representa los roles disponibles en el sistema.
 *
 * @public
 */
export type RoleName = keyof typeof ROLE_PERMISSIONS;
