import { Injectable } from '@nestjs/common';

import { PermissionEntity } from '../entities';

/**
 * Servicio de dominio para verificación y matching de permisos.
 *
 * @remarks
 * Contiene la lógica de negocio para determinar si un conjunto de permisos
 * cumple con los requisitos especificados.
 *
 * Sistema de permisos de 2 niveles:
 * - `resource:action` - Permiso básico (implica acceso a recursos propios)
 * - `resource:action:all` - Permiso administrativo (acceso a todos los recursos)
 * - `resource:manage` - Permiso de gestión completa del recurso
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
   * @returns true si el usuario tiene al menos uno de los permisos requeridos
   *
   * @remarks
   * - `resource:action` permite acceso a recursos propios
   * - `resource:action:all` permite acceso a todos los recursos
   * - `resource:manage` cubre todas las acciones del recurso
   * - Usa lógica OR: basta con tener UNO de los permisos requeridos
   *
   * @example
   * ```typescript
   * // Usuario tiene: ['user:read', 'session:manage']
   * hasAnyPermission(
   *   ['user:read', 'session:manage'],
   *   ['user:read', 'user:update']
   * ); // true (tiene user:read)
   *
   * // Usuario tiene: ['user:read']
   * hasAnyPermission(
   *   ['user:read'],
   *   ['user:update:all']
   * ); // false (no tiene user:update:all)
   * ```
   */
  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    // Crear entidades de los permisos del usuario para usar lógica de negocio
    const userPermissionEntities = userPermissions.map((name) => this.createPermissionEntity(name));

    for (const required of requiredPermissions) {
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
   * @returns true si el usuario tiene TODOS los permisos requeridos
   *
   * @remarks
   * Usa lógica AND: el usuario debe tener TODOS los permisos requeridos
   */
  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    const userPermissionEntities = userPermissions.map((name) => this.createPermissionEntity(name));

    for (const required of requiredPermissions) {
      if (!this.hasPermission(userPermissionEntities, required)) {
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
