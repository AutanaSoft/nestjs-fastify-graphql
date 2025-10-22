/**
 * Re-exportación de permisos iniciales y mapeo de roles.
 *
 * @remarks
 * Este archivo re-exporta las constantes de permisos desde el módulo de permissions
 * para mantener compatibilidad con los seeds existentes.
 *
 * La fuente de verdad para permisos y roles está en:
 * - src/modules/permissions/domain/constants/initial-permissions.ts
 * - src/modules/permissions/domain/constants/role-permissions.ts
 *
 * @deprecated Importar directamente desde '@/modules/permissions/domain/constants'
 */
import {
  INITIAL_PERMISSIONS as PERMISSIONS,
  ROLE_PERMISSIONS as ROLES,
} from '@/modules/permissions/domain/constants';

export { PERMISSIONS as INITIAL_PERMISSIONS, ROLES as ROLE_PERMISSIONS };
export type { Permission, PermissionName, RoleName } from '@/modules/permissions/domain/constants';

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
  const validPermissions = new Set<string>(PERMISSIONS.map((p) => p.name));
  const missingByRole: Record<string, string[]> = {};

  for (const [role, permissions] of Object.entries(rolePermissions)) {
    const missing = permissions.filter((p) => !validPermissions.has(p));
    if (missing.length > 0) {
      missingByRole[role] = [...missing];
    }
  }

  return missingByRole;
}
