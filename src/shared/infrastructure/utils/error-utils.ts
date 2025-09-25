import { GraphQLError } from 'graphql';

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
