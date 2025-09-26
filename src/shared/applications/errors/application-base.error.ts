import { GraphQLError, GraphQLErrorOptions } from 'graphql';

/**
 * Base class for domain errors surfaced via GraphQL.
 * @remarks
 * Prefer keeping pure domain errors decoupled from GraphQL and map them at the infrastructure layer.
 * This class ensures the prototype chain is correctly set and the error name matches the class name.
 */
export class ApplicationBaseError extends GraphQLError {
  /**
   * Create a new BaseDomainError.
   * @param message Human-readable error message.
   * @param options Optional GraphQL error options (path, extensions, etc.).
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain.
  }
}
