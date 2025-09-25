import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { registerAs } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { join } from 'node:path';

/**
 * GraphQL configuration interface defining Apollo Server options.
 * Controls development features and schema generation behavior.
 */
export type GraphQLConfig = {
  /** Indicates if the application is running in production mode */
  isProduction: boolean;
  /** Enable GraphQL introspection queries (typically disabled in production) */
  introspection: boolean;
  /** Sort schema fields alphabetically for consistent output */
  sortSchema: boolean;
  /** Enable GraphQL Playground UI (deprecated in favor of Apollo Studio) */
  playground: boolean;
  /** Use global prefix for GraphQL endpoint */
  useGlobalPrefix: boolean;
};

export interface GraphQLContext {
  req: FastifyRequest;
  res: FastifyReply;
}

export interface FastifyContext {
  request: FastifyRequest;
  reply: FastifyReply;
}

/**
 * GraphQL configuration factory registered under 'graphqlConfig' namespace.
 * Provides environment-aware defaults for Apollo Server configuration.
 *
 * @returns GraphQLConfig object with environment-specific settings
 */
export default registerAs('graphqlConfig', (): GraphQLConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    isProduction,
    introspection: !isProduction,
    sortSchema: !isProduction,
    useGlobalPrefix: true,
    playground: false, // Disabled by default; use Apollo Studio instead
  };
});

/**
 * Creates Apollo Server configuration options from GraphQL config.
 * Configures schema generation, development features, and server plugins.
 *
 * @param config - GraphQL configuration object with feature flags
 * @returns Apollo Driver configuration options (excluding driver property)
 */
export const createGraphQLModuleOptions = (
  config: GraphQLConfig,
): Omit<ApolloDriverConfig, 'driver'> => ({
  autoSchemaFile: join(process.cwd(), 'dist', 'schema', 'graphql.gql'),
  introspection: config.introspection,
  sortSchema: config.sortSchema,
  playground: config.playground,
  useGlobalPrefix: config.useGlobalPrefix,
  context: ({ request, reply }: FastifyContext): GraphQLContext => ({
    req: request,
    res: reply,
  }),
  plugins: [
    config.isProduction
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault(),
  ],
});
