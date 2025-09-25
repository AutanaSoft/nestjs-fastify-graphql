import type { AppConfig } from '@/config';

/**
 * Genera la URL base del servidor utilizando la configuración de la aplicación.
 * @param appConfig Configuración de la aplicación con los datos del servidor.
 * @returns URL del servidor normalizada sin barra final.
 */
export const buildServerUrl = (appConfig: AppConfig): string => {
  const { host, port, useGlobalPrefix, globalPrefix } = appConfig.server;

  const protocol = 'http';

  const baseUrl = new URL(`${protocol}://${host}`);
  // Always show the configured port
  baseUrl.port = port.toString();

  if (useGlobalPrefix && globalPrefix) {
    baseUrl.pathname = `/${globalPrefix}`;
  }

  return baseUrl.toString().replace(/\/$/, ''); // Remove trailing slash
};

/**
 * Genera la URL completa del endpoint de GraphQL a partir de la URL del servidor.
 * @param serverUrl URL base del servidor.
 * @param endpoint Nombre del endpoint de GraphQL; por defecto es "graphql".
 * @returns URL completa del endpoint de GraphQL.
 */
export const buildGraphQLUrl = (serverUrl: string, endpoint = 'graphql'): string => {
  return `${serverUrl}/${endpoint}`;
};
