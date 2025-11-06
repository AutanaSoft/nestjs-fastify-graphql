import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';

/**
 * Crea un error cuando el permiso solicitado no existe en el sistema.
 *
 * @param permissionName - Nombre del permiso que no se encontró
 * @returns Error de dominio con código PERMISSION_NOT_FOUND y estado 404
 */
export const createPermissionNotFoundError = (permissionName: string): DomainBaseError =>
  ErrorFactory.createNotFoundError({
    code: 'PERMISSION_NOT_FOUND',
    message: `Permission '${permissionName}' not found`,
  });

/**
 * Crea un error cuando se intenta asignar un permiso que ya está asignado al usuario.
 *
 * @param permissionName - Nombre del permiso ya asignado
 * @returns Error de dominio con código PERMISSION_ALREADY_ASSIGNED y estado 409
 */
export const createPermissionAlreadyAssignedError = (permissionName: string): DomainBaseError =>
  ErrorFactory.createConflictError({
    code: 'PERMISSION_ALREADY_ASSIGNED',
    message: `Permission '${permissionName}' is already assigned to user`,
  });

/**
 * Crea un error cuando se intenta revocar un permiso que no está asignado al usuario.
 *
 * @param permissionName - Nombre del permiso que no está asignado
 * @returns Error de dominio con código PERMISSION_NOT_ASSIGNED y estado 404
 */
export const createPermissionNotAssignedError = (permissionName: string): DomainBaseError =>
  ErrorFactory.createNotFoundError({
    code: 'PERMISSION_NOT_ASSIGNED',
    message: `Permission '${permissionName}' is not assigned to user`,
  });

/**
 * Crea un error cuando el usuario no tiene los permisos requeridos para realizar una acción.
 *
 * @param requiredPermissions - Array de permisos requeridos que el usuario no tiene
 * @returns Error de dominio con código INSUFFICIENT_PERMISSIONS y estado 403
 */
export const createInsufficientPermissionsError = (
  requiredPermissions: string[],
): DomainBaseError =>
  ErrorFactory.createForbiddenError({
    code: 'INSUFFICIENT_PERMISSIONS',
    message: `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
  });
