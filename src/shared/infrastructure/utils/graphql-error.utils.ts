import { HttpStatus } from '@nestjs/common';
import { GraphQLError } from 'graphql';

/**
 * Map HTTP status to commonly used GraphQL error codes.
 */
export function mapHttpStatusToGraphqlCode(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'BAD_USER_INPUT';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHENTICATED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

interface BuildGqlErrorOptions {
  path?: readonly (string | number)[];
  code: string;
  status: number;
  extensions?: Record<string, unknown>;
}

/**
 * Build a GraphQLError preserving path and composing extensions cleanly.
 */
export function buildGraphQLError(message: string, opts: BuildGqlErrorOptions): GraphQLError {
  return new GraphQLError(message, {
    path: opts.path,
    extensions: {
      code: opts.code,
      statusCode: opts.status,
      ...(opts.extensions ?? {}),
    },
  });
}

/**
 * Recreate a GraphQLError preserving metadata and adding correlationId safely.
 */
export function withCorrelationId(error: GraphQLError, correlationId: string): GraphQLError {
  const extensions = {
    ...(error.extensions ?? {}),
    correlationId: (error.extensions?.correlationId as string) ?? correlationId,
  } as Record<string, unknown>;

  return new GraphQLError(error.message, {
    nodes: error.nodes,
    source: error.source,
    positions: error.positions,
    path: error.path,
    originalError: error.originalError,
    extensions,
  });
}
