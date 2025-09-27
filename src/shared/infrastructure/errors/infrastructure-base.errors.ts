import { DomainBaseError } from '@/shared/domain/errors';
import { GraphQLErrorOptions } from 'graphql';

/**
 * Error base para la capa de infraestructura.
 * @public
 */
export class InfrastructureBaseError extends DomainBaseError {
  /**
   * Crea un error genérico de infraestructura.
   * @param message Mensaje que describe el problema.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error HTTP 400 para peticiones inválidas.
 * @public
 */
export class BadRequestError extends InfrastructureBaseError {
  /**
   * Crea un error para peticiones inválidas.
   * @param message Detalle del motivo de rechazo.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'BAD_REQUEST',
        statusCode: 400,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error HTTP 401 para accesos no autenticados.
 * @public
 */
export class UnauthorizedError extends InfrastructureBaseError {
  /**
   * Crea un error para accesos no autenticados.
   * @param message Detalle del problema de autenticación.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'UNAUTHORIZED',
        statusCode: 401,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error HTTP 403 para accesos no autorizados.
 * @public
 */
export class ForbiddenError extends InfrastructureBaseError {
  /**
   * Crea un error para accesos prohibidos.
   * @param message Detalle del motivo de prohibición.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'FORBIDDEN',
        statusCode: 403,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
