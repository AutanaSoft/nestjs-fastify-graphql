import type { PermissionName } from '../constants';

/**
 * Tipo que representa la asignación de permisos por rol.
 *
 * @public
 */
export type RolePermissionsMap = Record<string, readonly PermissionName[]>;

/**
 * Combina múltiples definiciones de permisos por rol en un solo objeto.
 *
 * @param moduleRolePermissions - Array de mapeos de permisos por rol desde diferentes módulos
 * @returns Objeto consolidado con todos los permisos de cada rol combinados
 *
 * @remarks
 * Esta función es útil para la arquitectura descentralizada donde cada módulo
 * define qué permisos tiene cada rol para sus recursos específicos.
 *
 * Cada módulo exporta su propia configuración de rol-permisos, y esta función
 * las combina en la estructura final ROLE_PERMISSIONS.
 *
 * Características:
 * - Combina permisos de múltiples módulos para el mismo rol
 * - Elimina duplicados automáticamente (usando Set)
 * - Mantiene el orden de los permisos (primero aparece, primero en el array)
 * - Type safe: solo acepta PermissionName válidos
 *
 * @example
 * ```typescript
 * const userRoles = {
 *   ADMIN: ['user:manage'],
 *   USER: ['user:read', 'user:update'],
 * };
 *
 * const sessionRoles = {
 *   ADMIN: ['session:manage'],
 *   USER: ['session:create'],
 * };
 *
 * const merged = mergeRolePermissions([userRoles, sessionRoles]);
 * // Resultado:
 * // {
 * //   ADMIN: ['user:manage', 'session:manage'],
 * //   USER: ['user:read', 'user:update', 'session:create']
 * // }
 * ```
 *
 * @public
 */
export function mergeRolePermissions(
  moduleRolePermissions: RolePermissionsMap[],
): Record<string, readonly PermissionName[]> {
  const merged: Record<string, Set<PermissionName>> = {};

  // Iterar sobre cada módulo
  for (const modulePerms of moduleRolePermissions) {
    // Iterar sobre cada rol en el módulo
    for (const [role, permissions] of Object.entries(modulePerms)) {
      // Inicializar Set para el rol si no existe
      if (!merged[role]) {
        merged[role] = new Set<PermissionName>();
      }

      // Agregar permisos al Set (elimina duplicados automáticamente)
      for (const permission of permissions) {
        merged[role].add(permission);
      }
    }
  }

  // Convertir Sets a arrays y hacer el objeto readonly
  const result: Record<string, readonly PermissionName[]> = {};
  for (const [role, permissionsSet] of Object.entries(merged)) {
    result[role] = Array.from(permissionsSet);
  }

  return result;
}
