import { HttpStatus } from '@nestjs/common';
import { GraphQLError, GraphQLErrorOptions } from 'graphql';

import { DomainBaseError } from '@/shared/domain/errors';

/**
 * Error lanzado cuando un permiso no es encontrado por su nombre.
 *
 * @public
 */
export class PermissionNotFoundError extends DomainBaseError {
  constructor(permissionName: string, options?: GraphQLErrorOptions) {
    super(`Permission '${permissionName}' not found`, {
      ...options,
      extensions: {
        code: 'PERMISSION_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        permissionName,
        ...options?.extensions,
      },
    });
  }
}

/**
 * Error lanzado cuando se intenta asignar un permiso que ya está asignado.
 *
 * @public
 */
export class PermissionAlreadyAssignedError extends DomainBaseError {
  constructor(userId: string, permissionName: string, options?: GraphQLErrorOptions) {
    super(`Permission '${permissionName}' is already assigned to user`, {
      ...options,
      extensions: {
        code: 'PERMISSION_ALREADY_ASSIGNED',
        status: HttpStatus.CONFLICT,
        userId,
        permissionName,
        ...options?.extensions,
      },
    });
  }
}

/**
 * Error lanzado cuando se intenta revocar un permiso que no está asignado.
 *
 * @public
 */
export class PermissionNotAssignedError extends DomainBaseError {
  constructor(userId: string, permissionName: string, options?: GraphQLErrorOptions) {
    super(`Permission '${permissionName}' is not assigned to user`, {
      ...options,
      extensions: {
        code: 'PERMISSION_NOT_ASSIGNED',
        status: HttpStatus.NOT_FOUND,
        userId,
        permissionName,
        ...options?.extensions,
      },
    });
  }
}

/**
 * Error lanzado cuando un usuario no tiene permisos suficientes para realizar una acción.
 *
 * @public
 */
export class InsufficientPermissionsError extends GraphQLError {
  constructor(requiredPermissions: string[], options?: GraphQLErrorOptions) {
    super(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`, {
      ...options,
      extensions: {
        code: 'INSUFFICIENT_PERMISSIONS',
        status: HttpStatus.FORBIDDEN,
        requiredPermissions,
        ...options?.extensions,
      },
    });

    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
