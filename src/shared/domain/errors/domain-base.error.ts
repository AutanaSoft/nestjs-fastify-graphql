import { HttpStatus } from '@nestjs/common';
import { GraphQLError, GraphQLErrorOptions } from 'graphql';

/**
 * Error base del dominio para mapear errores a GraphQL.
 * @public
 */
export class DomainBaseError extends GraphQLError {
  /**
   * Crea una instancia de error de dominio base.
   * @param message Mensaje legible para las personas.
   * @param options Opciones adicionales de GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain.
  }
}

/**
 * Error de dominio cuando la base de datos falla.
 * @public
 */
export class DataBaseError extends DomainBaseError {
  /**
   * Crea un error de base de datos.
   * @param message Mensaje legible para las personas.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'DATA_BASE_SERVER_ERROR',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de conflicto en el dominio cuando la operación no es válida.
 * @public
 */
export class ConflictError extends DomainBaseError {
  /**
   * Crea un error de conflicto.
   * @param message Mensaje legible para las personas.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'CONFLICT',
        status: HttpStatus.CONFLICT,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio cuando no se encuentra un recurso.
 * @public
 */
export class NotFoundError extends DomainBaseError {
  /**
   * Crea un error de recurso no encontrado.
   * @param message Mensaje legible para las personas.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error de dominio cuando un servicio externo falla.
 * @public
 */
export class ExternalServiceError extends DomainBaseError {
  /**
   * Crea un error por fallo externo.
   * @param message Mensaje legible para las personas.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'EXTERNAL_SERVICE_ERROR',
        status: HttpStatus.BAD_GATEWAY,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
