import { GraphQLError, GraphQLErrorOptions } from 'graphql';

/**
 * Error base para excepciones de aplicación expuestas vía GraphQL.
 * @public
 */
export class ApplicationBaseError extends GraphQLError {
  /**
   * Crea una nueva instancia con metadatos opcionales de GraphQL.
   * @param message Mensaje descriptivo del error.
   * @param options Opciones adicionales para GraphQL.
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain.
  }
}
