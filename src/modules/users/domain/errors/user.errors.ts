import { HttpStatus } from '@nestjs/common';
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
        status: HttpStatus.NOT_FOUND,
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
        status: HttpStatus.FORBIDDEN,
        userName,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio que indica que el dominio del email está prohibido.
 * @public
 */
export class ForbiddenEmailDomainError extends DomainBaseError {
  constructor(email: string, domain: string, options?: GraphQLErrorOptions) {
    super(`The email domain "${domain}" from "${email}" is not allowed`, {
      ...options,
      extensions: {
        code: 'FORBIDDEN_EMAIL_DOMAIN',
        status: HttpStatus.FORBIDDEN,
        email,
        domain,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio que indica que la operación de actualización del usuario falló.
 * @public
 */
export class UserUpdateFailedError extends DomainBaseError {
  constructor(userId: string, options?: GraphQLErrorOptions) {
    super(`Failed to update user with ID ${userId}`, {
      ...options,
      extensions: {
        code: 'USER_UPDATE_FAILED',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        userId,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
