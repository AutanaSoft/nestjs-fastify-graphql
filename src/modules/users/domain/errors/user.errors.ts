import { DomainBaseError } from '@/shared/domain/errors/domain-base.error';
import { GraphQLErrorOptions } from 'graphql';

/**
 * Error de dominio que indica que el usuario solicitado no existe en el sistema.
 * @public
 */
export class UserNotFoundError extends DomainBaseError {
  constructor(message?: string, options?: GraphQLErrorOptions) {
    super(message || 'User not found', {
      ...options,
      extensions: {
        code: 'USER_NOT_FOUND',
        statusCode: 404,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
