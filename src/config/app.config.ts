import { registerAs } from '@nestjs/config';

/**
 * Niveles de logging disponibles para la aplicación.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Configuración principal de la aplicación.
 * Define los parámetros globales del servidor y metadatos de la aplicación.
 */
export interface AppConfig {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly server: {
    readonly host: string;
    readonly port: number;
    readonly useGlobalPrefix: boolean;
    readonly globalPrefix: string;
    readonly environment: string;
    readonly correlationIdHeader: string;
    readonly logLevel: LogLevel;
  };
}

/**
 * Factory que genera la configuración de la aplicación desde variables de entorno.
 * Lee las variables de entorno y proporciona valores por defecto para desarrollo.
 *
 * @returns Configuración completa de la aplicación
 */
export const appConfigFactory = (): AppConfig => ({
  name: process.env.APP_NAME || 'NestJS GraphQL API',
  description: process.env.APP_DESCRIPTION || 'API built with NestJS and GraphQL',
  version: process.env.APP_VERSION || '1.0.0',
  server: {
    host: process.env.APP_SERVER_HOST || 'localhost',
    port: parseInt(process.env.APP_PORT || '4200', 10),
    useGlobalPrefix: process.env.APP_USE_GLOBAL_PREFIX === 'true',
    globalPrefix: process.env.APP_GLOBAL_PREFIX || 'api',
    environment: process.env.NODE_ENV || 'development',
    correlationIdHeader: process.env.APP_CORRELATION_ID_HEADER || 'x-correlation-id',
    logLevel: (process.env.APP_LOG_LEVEL as LogLevel) || 'debug',
  },
});

export default registerAs<AppConfig>('appConfig', (): AppConfig => appConfigFactory());
