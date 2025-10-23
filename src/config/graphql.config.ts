import { GraphQLContext } from '@/shared/domain/types';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { registerAs } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { join } from 'node:path';

/**
 * Configuración base para la inicialización del servidor GraphQL.
 *
 * @public
 * @property {boolean} isProduction - Indica si la aplicación se ejecuta en modo producción.
 * @property {boolean} introspection - Habilita la introspección del esquema GraphQL (deshabilitada en producción).
 * @property {boolean} sortSchema - Ordena alfabéticamente el esquema para facilitar comparaciones determinísticas.
 * @property {boolean} playground - Controla la disponibilidad del GraphQL Playground (deshabilitado por defecto).
 * @property {boolean} useGlobalPrefix - Aplica el prefijo global de NestJS a las rutas del endpoint GraphQL.
 */
export type GraphQLConfig = {
  isProduction: boolean;
  introspection: boolean;
  sortSchema: boolean;
  playground: boolean;
  useGlobalPrefix: boolean;
};

/**
 * Factoría que genera la configuración de GraphQL según el entorno de ejecución.
 *
 * Lee la variable de entorno `NODE_ENV` para determinar el modo de operación y
 * configura automáticamente las opciones de introspección, ordenamiento de esquema
 * y disponibilidad del playground.
 *
 * @returns {GraphQLConfig} Objeto de configuración con valores apropiados para el entorno.
 */
export const graphqlConfigFactory = (): GraphQLConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    isProduction,
    introspection: !isProduction,
    sortSchema: !isProduction,
    useGlobalPrefix: true,
    playground: false,
  };
};

/**
 * Registro de configuración tipado para el módulo GraphQL.
 *
 * Utiliza el sistema de configuración de NestJS para registrar los parámetros
 * bajo el namespace 'graphqlConfig'. Permite inyección tipada mediante
 * `@Inject(graphqlConfig.KEY)` o `ConfigService.get<GraphQLConfig>('graphqlConfig')`.
 *
 * @public
 * @returns {GraphQLConfig} Configuración evaluada según el entorno actual.
 */
export default registerAs('graphqlConfig', (): GraphQLConfig => graphqlConfigFactory());

/**
 * Crea las opciones del módulo GraphQL para el driver Apollo.
 *
 * Genera un objeto de configuración compatible con `ApolloDriver` que incluye:
 * - Generación automática del esquema en `dist/schema/graphql.gql`
 * - Configuración de introspección y playground según el entorno
 * - Contexto GraphQL con acceso a request y response de Fastify
 * - Plugins de Apollo Server para landing page según el modo de producción
 *
 * @public
 * @param {GraphQLConfig} config - Configuración operativa de GraphQL generada por `graphqlConfigFactory`.
 * @returns {Omit<ApolloDriverConfig, 'driver'>} Opciones listas para el módulo GraphQL de NestJS.
 * @remarks
 * El contexto incluye objetos `req` y `res` de Fastify, permitiendo acceso a
 * headers, cookies y otras propiedades de la petición HTTP en los resolvers.
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
