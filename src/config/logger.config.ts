import { registerAs } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import { IncomingMessage } from 'node:http';
import { join } from 'node:path';

/**
 * Describe la configuración necesaria para inicializar el registro HTTP basado en pino.
 * @remarks
 * Los valores se derivan de variables de entorno prefijadas con `LOG_`.
 * @public
 */
export type LoggerConfig = {
  isProduction: boolean;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  logDir: string;
  logMaxSize: number;
  logMaxFiles: number;
  logRotationFrequency?: string;
};

/**
 * Conjunto de paths redactados automáticamente para evitar exponer datos sensibles.
 * @remarks
 * Se aplica sobre las propiedades de las solicitudes y respuestas capturadas por pino.
 */
const SENSITIVE_KEYS: readonly string[] = [
  '*.password',
  '*.*.password',
  '*.*.*.password',
  '*.*.*.*.password',
  '*.authorization',
  '*.*.authorization',
  '*.*.*.authorization',
  '*.*.*.*.authorization',
  '*.cookies',
  '*.*.cookies',
  '*.*.*.cookies',
  '*.*.*.*.cookies',
];

/**
 * Registra la configuración principal del logger bajo el espacio `loggerConfig`.
 * @returns Configuración tipada construida a partir de las variables de entorno.
 */
export default registerAs(
  'loggerConfig',
  (): LoggerConfig => ({
    isProduction: process.env.NODE_ENV === 'production',
    logLevel: (process.env.LOG_LEVEL as LoggerConfig['logLevel']) ?? 'info',
    logDir: process.env.LOG_DIR ?? join(process.cwd(), 'logs'),
    logMaxSize: Number(process.env.LOG_MAX_SIZE) || 10,
    logMaxFiles: Number(process.env.LOG_MAX_FILES) || 5,
    logRotationFrequency: process.env.LOG_ROTATION_FREQUENCY || 'daily',
  }),
);

/**
 * Traduce la configuración tipada en opciones para `nestjs-pino`.
 * @param config Valores de configuración del logger.
 * @returns Parámetros compatibles con el módulo de logging HTTP.
 */
export const createLoggerModuleOptions = (config: LoggerConfig): Params => ({
  pinoHttp: {
    level: config.logLevel,
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          level: config.logLevel,
          options: {
            colorize: true,
            singleLine: true,
            levelFirst: false,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'hostname,pid',
            messageFormat: '[{context}] {msg}',
          },
        },
      ],
    },
    redact: {
      paths: SENSITIVE_KEYS.flatMap((key) => key),
      censor: '[REDACTED]',
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    customProps: (req: IncomingMessage) => ({
      context: req.url ?? 'HTTP',
      correlationId: req.id ?? 'x-correlation-id-not-set',
    }),
  },
});
