import { BaseDomainError } from '@/shared/domain/errors';
import { GraphQLErrorOptions } from 'graphql';

/**
 * Base error for infrastructure layer.
 * Standardizes GraphQL error shape by leveraging BaseDomainError.
 * @public
 * @extends BaseDomainError
 * @param message Human-readable error message.
 * @param options Optional GraphQLErrorOptions to enrich the error.
 * @remarks Ensures proper prototype chain and class name for instanceof checks.
 */
export class InfrastructureError extends BaseDomainError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Infrastructure error representing database-related failures.
 * Sets GraphQL extensions with code 'DATA_BASE_SERVER_ERROR' and statusCode 500.
 * @public
 * @extends InfrastructureError
 * @param message Human-readable error message.
 * @param options Optional GraphQLErrorOptions; extensions will be merged.
 * @see InfrastructureError
 */
export class DataBaseError extends InfrastructureError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'DATA_BASE_SERVER_ERROR',
        statusCode: 500,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Infrastructure error for external service communication failures.
 * Sets GraphQL extensions with code 'EXTERNAL_SERVICE_ERROR' and statusCode 502.
 * @public
 * @extends InfrastructureError
 * @param message Human-readable error message.
 * @param options Optional GraphQLErrorOptions; extensions will be merged.
 * @see InfrastructureError
 */
export class ExternalServiceError extends InfrastructureError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'EXTERNAL_SERVICE_ERROR',
        statusCode: 502,
        ...options?.extensions,
      },
    });
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error representing a client-side bad request.
 * Sets GraphQL extensions with code 'BAD_REQUEST' and statusCode 400.
 * @public
 * @extends InfrastructureError
 * @param message Human-readable error message.
 * @param options Optional GraphQLErrorOptions; extensions will be merged.
 */
export class BadRequestError extends InfrastructureError {
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
 * Error representing authentication failure / missing credentials.
 * Sets GraphQL extensions with code 'UNAUTHORIZED' and statusCode 401.
 * @public
 * @extends InfrastructureError
 * @param message Human-readable error message.
 * @param options Optional GraphQLErrorOptions; extensions will be merged.
 */
export class UnauthorizedError extends InfrastructureError {
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

export class ForbiddenError extends InfrastructureError {
  /**
   * Error representing authorization failure (insufficient permissions).
   * Sets GraphQL extensions with code 'FORBIDDEN' and statusCode 403.
   * @public
   * @extends InfrastructureError
   * @param message Human-readable error message.
   * @param options Optional GraphQLErrorOptions; extensions will be merged.
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
