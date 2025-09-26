import { BaseDomainError } from '@/shared/domain/errors/base-domain.exception';
import { GraphQLErrorOptions } from 'graphql';

export class UserNotFoundError extends BaseDomainError {
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
