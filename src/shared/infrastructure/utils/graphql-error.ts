import { GraphQLError } from 'graphql';

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
