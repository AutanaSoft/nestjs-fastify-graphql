import { ROLE_PERMISSIONS } from '@/modules/permissions/domain/constants';
import { UserRole } from '../enums/user.enum';

/**
 * Servicio de dominio para gestión de permisos de usuario.
 *
 * Proporciona lógica de negocio para la asignación automática de permisos
 * basada en roles y gestión de permisos de usuario.
 *
 * @public
 */
export class UserPermissionService {
  /**
   * Obtiene los permisos predeterminados para un rol específico.
   *
   * @param role - Rol del usuario
   * @returns Array de nombres de permisos asociados al rol
   *
   * @remarks
   * Los permisos se obtienen de la configuración de roles predefinida
   * en ROLE_PERMISSIONS. Si el rol no existe, se retorna un array vacío.
   */
  static getDefaultPermissionsForRole(role: UserRole): string[] {
    const roleKey = role as keyof typeof ROLE_PERMISSIONS;
    return ROLE_PERMISSIONS[roleKey] ? [...ROLE_PERMISSIONS[roleKey]] : [];
  }

  /**
   * Combina permisos de rol con permisos adicionales únicos.
   *
   * @param role - Rol base del usuario
   * @param additionalPermissions - Permisos adicionales a agregar
   * @returns Array de permisos únicos (sin duplicados)
   *
   * @remarks
   * Útil para asignar permisos personalizados además de los permisos del rol base.
   * Se eliminan automáticamente los permisos duplicados.
   */
  static combinePermissions(role: UserRole, additionalPermissions: string[] = []): string[] {
    const rolePermissions = this.getDefaultPermissionsForRole(role);
    const allPermissions = [...rolePermissions, ...additionalPermissions];

    // Eliminar duplicados manteniendo el orden
    return [...new Set(allPermissions)];
  }

  /**
   * Valida si un conjunto de permisos es válido para un rol.
   *
   * @param role - Rol del usuario
   * @param permissions - Permisos a validar
   * @returns true si los permisos incluyen al menos los del rol base
   *
   * @remarks
   * Verifica que el usuario tenga como mínimo los permisos requeridos
   * por su rol, permitiendo permisos adicionales.
   */
  static validatePermissionsForRole(role: UserRole, permissions: string[]): boolean {
    const requiredPermissions = this.getDefaultPermissionsForRole(role);
    return requiredPermissions.every((permission) => permissions.includes(permission));
  }
}
