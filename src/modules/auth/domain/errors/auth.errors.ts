import { HttpStatus } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { DomainBaseError } from '@/shared/domain/errors';

/**
 * Error de dominio cuando las credenciales de autenticación son inválidas.
 *
 * @public
 */
export class InvalidCredentialsError extends DomainBaseError {
  /**
   * Crea un error de credenciales inválidas.
   *
   * @param message Mensaje descriptivo del error
   * @param options Opciones adicionales para GraphQL
   */
  constructor(message: string = 'Invalid email or password', options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'INVALID_CREDENTIALS',
        status: HttpStatus.UNAUTHORIZED,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio cuando se intenta autenticar con una cuenta no verificada.
 *
 * @public
 */
export class AccountNotVerifiedError extends DomainBaseError {
  /**
   * Crea un error de cuenta no verificada.
   *
   * @param email Email de la cuenta no verificada
   * @param options Opciones adicionales para GraphQL
   */
  constructor(email: string, options?: GraphQLErrorOptions) {
    super('Account email is not verified. Please check your email and verify your account.', {
      ...options,
      extensions: {
        code: 'ACCOUNT_NOT_VERIFIED',
        status: HttpStatus.FORBIDDEN,
        email,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio cuando se intenta autenticar con una cuenta suspendida o baneada.
 *
 * @public
 */
export class AccountSuspendedError extends DomainBaseError {
  /**
   * Crea un error de cuenta suspendida.
   *
   * @param status Estado actual de la cuenta
   * @param options Opciones adicionales para GraphQL
   */
  constructor(status: string, options?: GraphQLErrorOptions) {
    super(`Account is ${status.toLowerCase()}. Please contact support.`, {
      ...options,
      extensions: {
        code: 'ACCOUNT_SUSPENDED',
        status: HttpStatus.FORBIDDEN,
        accountStatus: status,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
