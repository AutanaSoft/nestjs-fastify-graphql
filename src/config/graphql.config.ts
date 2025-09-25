import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { registerAs } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { join } from 'node:path';

/**
 * @public Configuración base para la inicialización del servidor GraphQL.
 * @property {boolean} isProduction Define si la aplicación está en modo producción.
 * @property {boolean} introspection Habilita la introspección del esquema.
 * @property {boolean} sortSchema Ordena el esquema para lecturas determinísticas.
 * @property {boolean} playground Controla la disponibilidad del playground.
 * @property {boolean} useGlobalPrefix Aplica el prefijo global de NestJS a las rutas GraphQL.
 */
export type GraphQLConfig = {
  isProduction: boolean;
  introspection: boolean;
  sortSchema: boolean;
  playground: boolean;
  useGlobalPrefix: boolean;
};

/**
 * @public Contexto compartido entre resolvers de GraphQL con acceso a la solicitud y respuesta.
 */
export interface GraphQLContext {
  readonly req: FastifyRequest;
  readonly res: FastifyReply;
}

/**
 * @public Factoría de configuración que expone los parámetros del módulo GraphQL.
 * @returns {GraphQLConfig} Configuración evaluada según el entorno.
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
 * @public Crea las opciones del módulo GraphQL para el `ApolloDriver`.
 * @param {GraphQLConfig} config Configuración operativa de GraphQL.
 * @returns {Omit<ApolloDriverConfig, 'driver'>} Opciones listas para el módulo GraphQL de NestJS.
 */
export const createGraphQLModuleOptions = (
  config: GraphQLConfig,
): Omit<ApolloDriverConfig, 'driver'> => ({
  autoSchemaFile: join(process.cwd(), 'dist', 'schema', 'graphql.gql'),
  introspection: config.introspection,
  sortSchema: config.sortSchema,
  playground: config.playground,
  useGlobalPrefix: config.useGlobalPrefix,
  context: (request: FastifyRequest, reply: FastifyReply): GraphQLContext => ({
    req: request,
    res: reply,
  }),

  plugins: [
    config.isProduction
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault(),
  ],
});
