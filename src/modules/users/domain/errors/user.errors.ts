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

/**
 * Error de dominio que indica que el nombre de usuario está prohibido.
 * @public
 */
export class ForbiddenUserNameError extends DomainBaseError {
  constructor(userName: string, options?: GraphQLErrorOptions) {
    super(`The username "${userName}" is not allowed`, {
      ...options,
      extensions: {
        code: 'FORBIDDEN_USERNAME',
        statusCode: 400,
        userName,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
