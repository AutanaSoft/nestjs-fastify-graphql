import { DomainBaseError } from '@/shared/domain/errors/domain-base.error';
import { GraphQLErrorOptions } from 'graphql';

/**
 * Error de dominio que indica que ya existe un usuario con los mismos datos únicos.
 * @public
 */
export class UserAlreadyExistsError extends DomainBaseError {
  constructor(message?: string, options?: GraphQLErrorOptions) {
    super(message ?? 'User already exists', {
      ...options,
      extensions: {
        code: 'USER_ALREADY_EXISTS',
        statusCode: 409,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio que indica que una relación requerida para el usuario no existe.
 * @public
 */
export class UserForeignKeyViolationError extends DomainBaseError {
  constructor(message?: string, options?: GraphQLErrorOptions) {
    super(message ?? 'Related record not found for user operation', {
      ...options,
      extensions: {
        code: 'USER_FOREIGN_KEY_VIOLATION',
        statusCode: 409,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

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
