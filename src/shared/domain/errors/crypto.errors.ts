import { HttpStatus } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { DomainBaseError } from './domain-base.error';

/**
 * Error de dominio cuando falla una operación de cifrado.
 * @public
 */
export class EncryptionError extends DomainBaseError {
  /**
   * Crea un error de cifrado.
   * @param message Mensaje descriptivo del error. Por defecto: 'Failed to encrypt data'.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string = 'Failed to encrypt data', options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'ENCRYPTION_FAILED',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio cuando falla una operación de descifrado.
 * @public
 */
export class DecryptionError extends DomainBaseError {
  /**
   * Crea un error de descifrado.
   * @param message Mensaje descriptivo del error. Por defecto: 'Failed to decrypt data'.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string = 'Failed to decrypt data', options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'DECRYPTION_FAILED',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
