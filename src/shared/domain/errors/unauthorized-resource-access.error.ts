import { HttpStatus } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';

import { DomainBaseError } from './domain-base.error';

/**
 * Error de dominio que se lanza cuando un usuario intenta acceder a un recurso que no le pertenece.
 *
 * @remarks
 * Este error debe usarse en los casos de uso cuando se valida la propiedad de un recurso.
 * Indica que el usuario está autenticado y tiene el permiso necesario, pero el recurso
 * específico no le pertenece o no tiene acceso autorizado a él.
 *
 * @public
 */
export class UnauthorizedResourceAccessError extends DomainBaseError {
  /**
   * Crea una instancia de UnauthorizedResourceAccessError.
   *
   * @param resourceType - Tipo de recurso al que se intentó acceder (ej: 'user', 'post', 'comment')
   * @param resourceId - ID del recurso al que se intentó acceder
   * @param options - Opciones adicionales de GraphQL error
   */
  constructor(resourceType: string, resourceId: string, options?: GraphQLErrorOptions) {
    const message = `You do not have access to ${resourceType} with ID ${resourceId}`;

    super(message, {
      ...options,
      extensions: {
        code: 'UNAUTHORIZED_RESOURCE_ACCESS',
        status: HttpStatus.FORBIDDEN,
        resourceType,
        resourceId,
        ...options?.extensions,
      },
    });

    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
