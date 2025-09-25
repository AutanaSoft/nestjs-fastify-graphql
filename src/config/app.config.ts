import { registerAs } from '@nestjs/config';

/**
 * Identificador del encabezado HTTP usado para correlacionar solicitudes.
 * @public
 */
export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

/**
 * Nivel de detalle de los logs de la aplicación.
 * @public
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Contrato tipado e inmutable de la configuración de la aplicación.
 * Incluye metadatos y parámetros del servidor.
 * @public
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
    readonly logLevel: LogLevel;
  };
}

/**
 * Fábrica tipada de configuración de la aplicación.
 * Lee variables de entorno, aplica conversiones explícitas y valores por defecto para desarrollo.
 * @returns Configuración de la aplicación lista para inyección vía ConfigService.
 * @public
 */
export default registerAs<AppConfig>(
  'appConfig',
  (): AppConfig => ({
    name: process.env.APP_NAME || 'NestJS GraphQL API',
    description:
      process.env.APP_DESCRIPTION || 'API built with NestJS and GraphQL',
    version: process.env.APP_VERSION || '1.0.0',
    server: {
      host: process.env.APP_SERVER_HOST || 'localhost',
      port: parseInt(process.env.APP_SERVER_PORT || '4200', 10),
      useGlobalPrefix: process.env.APP_SERVER_USE_GLOBAL_PREFIX === 'true',
      globalPrefix: process.env.APP_SERVER_GLOBAL_PREFIX || 'api',
      environment: process.env.NODE_ENV || 'development',
      logLevel: (process.env.APP_SERVER_LOG_LEVEL as LogLevel) || 'debug',
    },
  }),
);
