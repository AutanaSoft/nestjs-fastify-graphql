/**
 * Helpers para crear errores específicos del módulo de permisos usando ErrorFactory.
 *
 * @remarks
 * Este archivo proporciona funciones helper para crear errores relacionados con permisos
 * de forma consistente usando los métodos genéricos del ErrorFactory basados en HTTP status.
 * Los helpers solo componen el mensaje y pasan el código, mensaje y contexto apropiados.
 *
 * **Ventajas**:
 * - Helpers mínimos (1-2 líneas)
 * - Sin duplicación de status codes
 * - Type-safe
 * - Fácil de testear
 *
 * @example
 * ```typescript
 * // En use cases
 * import { createPermissionNotFoundError, createInsufficientPermissionsError } from './permission-error.helpers';
 *
 * throw createPermissionNotFoundError('read:users');
 * throw createInsufficientPermissionsError(['write:users', 'admin']);
 * ```
 */

import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';

/**
 * Crea un error de permiso no encontrado (404).
 *
 * @param permissionName - Nombre del permiso que no se encontró
 * @returns Error de dominio NOT_FOUND con contexto del permiso
 *
 * @example
 * ```typescript
 * throw createPermissionNotFoundError('read:users');
 * // PERMISSION_NOT_FOUND: Permission 'read:users' not found
 * ```
 */
export const createPermissionNotFoundError = (permissionName: string): DomainBaseError =>
  ErrorFactory.createNotFoundError(
    'PERMISSION_NOT_FOUND',
    `Permission '${permissionName}' not found`,
    { permissionName },
  );

/**
 * Crea un error de permiso ya asignado (409).
 *
 * @param userId - ID del usuario
 * @param permissionName - Nombre del permiso ya asignado
 * @returns Error de dominio CONFLICT indicando que el permiso ya está asignado
 *
 * @example
 * ```typescript
 * throw createPermissionAlreadyAssignedError('123', 'read:users');
 * // PERMISSION_ALREADY_ASSIGNED: Permission 'read:users' is already assigned to user
 * ```
 */
export const createPermissionAlreadyAssignedError = (
  userId: string,
  permissionName: string,
): DomainBaseError =>
  ErrorFactory.createConflictError(
    'PERMISSION_ALREADY_ASSIGNED',
    `Permission '${permissionName}' is already assigned to user`,
    { userId, permissionName },
  );

/**
 * Crea un error de permiso no asignado (404).
 *
 * @param userId - ID del usuario
 * @param permissionName - Nombre del permiso que no está asignado
 * @returns Error de dominio NOT_FOUND indicando que el permiso no está asignado al usuario
 *
 * @example
 * ```typescript
 * throw createPermissionNotAssignedError('123', 'write:users');
 * // PERMISSION_NOT_ASSIGNED: Permission 'write:users' is not assigned to user
 * ```
 */
export const createPermissionNotAssignedError = (
  userId: string,
  permissionName: string,
): DomainBaseError =>
  ErrorFactory.createNotFoundError(
    'PERMISSION_NOT_ASSIGNED',
    `Permission '${permissionName}' is not assigned to user`,
    { userId, permissionName },
  );

/**
 * Crea un error de permisos insuficientes (403).
 *
 * @param requiredPermissions - Array de permisos requeridos que el usuario no tiene
 * @returns Error de dominio FORBIDDEN indicando permisos insuficientes
 *
 * @example
 * ```typescript
 * throw createInsufficientPermissionsError(['write:users', 'admin']);
 * // INSUFFICIENT_PERMISSIONS: Insufficient permissions. Required: write:users, admin
 * ```
 */
export const createInsufficientPermissionsError = (
  requiredPermissions: string[],
): DomainBaseError =>
  ErrorFactory.createForbiddenError(
    'INSUFFICIENT_PERMISSIONS',
    `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
    { requiredPermissions },
  );
