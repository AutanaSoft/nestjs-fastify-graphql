import { Injectable } from '@nestjs/common';

import { PermissionEntity } from '../entities';

/**
 * Servicio de dominio para verificación y matching de permisos.
 *
 * @remarks
 * Contiene la lógica de negocio para determinar si un conjunto de permisos
 * cumple con los requisitos especificados, incluyendo soporte para alcances
 * (own vs all) y permisos de gestión (manage).
 *
 * @public
 */
@Injectable()
export class PermissionMatcherService {
  /**
   * Verifica si los permisos del usuario cubren al menos uno de los permisos requeridos.
   *
   * @param userPermissions - Array de nombres de permisos que tiene el usuario
   * @param requiredPermissions - Array de nombres de permisos requeridos (OR logic)
   * @param isOwnResource - Si la operación es sobre un recurso propio del usuario
   * @returns true si el usuario tiene al menos uno de los permisos requeridos
   *
   * @remarks
   * - Si `isOwnResource` es true, primero intenta con permisos :own
   * - Luego verifica permisos :all o manage
   * - Usa lógica OR: basta con tener UNO de los permisos requeridos
   *
   * @example
   * ```typescript
   * // Usuario tiene: ['user:read:own', 'session:manage']
   * // Intenta: leer su propio perfil
   * hasAnyPermission(
   *   ['user:read:own', 'session:manage'],
   *   ['user:read:all'],
   *   true // es su propio recurso
   * ); // true (tiene user:read:own)
   *
   * // Usuario tiene: ['user:read:own']
   * // Intenta: leer perfil de otro usuario
   * hasAnyPermission(
   *   ['user:read:own'],
   *   ['user:read:all'],
   *   false // no es su recurso
   * ); // false (no tiene user:read:all)
   * ```
   */
  hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[],
    isOwnResource: boolean = false,
  ): boolean {
    // Crear entidades de los permisos del usuario para usar lógica de negocio
    const userPermissionEntities = userPermissions.map((name) => this.createPermissionEntity(name));

    for (const required of requiredPermissions) {
      // Si es recurso propio, primero intentar con permiso :own
      if (isOwnResource) {
        const ownPermission = this.convertToOwnScope(required);
        if (this.hasPermission(userPermissionEntities, ownPermission)) {
          return true;
        }
      }

      // Verificar permiso :all o manage
      if (this.hasPermission(userPermissionEntities, required)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si el usuario tiene todos los permisos requeridos.
   *
   * @param userPermissions - Array de nombres de permisos que tiene el usuario
   * @param requiredPermissions - Array de nombres de permisos requeridos (AND logic)
   * @param isOwnResource - Si la operación es sobre un recurso propio del usuario
   * @returns true si el usuario tiene TODOS los permisos requeridos
   *
   * @remarks
   * Usa lógica AND: el usuario debe tener TODOS los permisos requeridos
   */
  hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: string[],
    isOwnResource: boolean = false,
  ): boolean {
    const userPermissionEntities = userPermissions.map((name) => this.createPermissionEntity(name));

    for (const required of requiredPermissions) {
      let hasThis = false;

      // Si es recurso propio, verificar permiso :own
      if (isOwnResource) {
        const ownPermission = this.convertToOwnScope(required);
        if (this.hasPermission(userPermissionEntities, ownPermission)) {
          hasThis = true;
        }
      }

      // Verificar permiso :all o manage
      if (!hasThis && this.hasPermission(userPermissionEntities, required)) {
        hasThis = true;
      }

      if (!hasThis) {
        return false; // Falta al menos un permiso requerido
      }
    }

    return true;
  }

  /**
   * Verifica si el usuario tiene un permiso específico.
   *
   * @param userPermissionEntities - Entidades de permisos del usuario
   * @param required - Nombre del permiso requerido
   * @returns true si el usuario tiene el permiso (directamente o por manage)
   *
   * @private
   */
  private hasPermission(userPermissionEntities: PermissionEntity[], required: string): boolean {
    return userPermissionEntities.some((permission) => permission.covers(required));
  }

  /**
   * Convierte un permiso :all a su equivalente :own.
   *
   * @param permission - Nombre del permiso (ej: 'user:read:all')
   * @returns Permiso con scope :own (ej: 'user:read:own')
   *
   * @remarks
   * Si el permiso no tiene scope, lo retorna sin cambios
   *
   * @private
   */
  private convertToOwnScope(permission: string): string {
    return permission.replace(':all', ':own');
  }

  /**
   * Crea una entidad de permiso temporal para usar su lógica de negocio.
   *
   * @param name - Nombre del permiso
   * @returns Entidad PermissionEntity con propiedades mínimas
   *
   * @private
   */
  private createPermissionEntity(name: string): PermissionEntity {
    return PermissionEntity.toDomain({
      id: 'temp-id',
      name,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
