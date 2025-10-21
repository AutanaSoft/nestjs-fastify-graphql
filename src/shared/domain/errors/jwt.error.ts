import { HttpStatus } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { DomainBaseError } from './domain-base.error';

/**
 * Excepción lanzada cuando un token JWT ha expirado
 * @public
 */
export class TokenExpiredDomainException extends DomainBaseError {
  /**
   * Crea una instancia de error de token expirado.
   * @param options Opciones adicionales de GraphQL.
   */
  constructor(options?: GraphQLErrorOptions) {
    super('Token has expired', {
      ...options,
      extensions: {
        code: 'TOKEN_EXPIRED',
        status: HttpStatus.UNAUTHORIZED,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Excepción lanzada cuando un token JWT es inválido o malformado
 * @public
 */
export class InvalidTokenDomainException extends DomainBaseError {
  /**
   * Crea una instancia de error de token inválido.
   * @param options Opciones adicionales de GraphQL.
   */
  constructor(options?: GraphQLErrorOptions) {
    super('Invalid token provided', {
      ...options,
      extensions: {
        code: 'INVALID_TOKEN',
        status: HttpStatus.UNAUTHORIZED,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
