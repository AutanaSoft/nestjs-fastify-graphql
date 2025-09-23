import { registerAs } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import { IncomingMessage } from 'node:http';
import { join } from 'node:path';

/**
 * Configuración del sistema de logging de la aplicación.
 * Define los parámetros para el comportamiento del logger basado en Pino.
 */
export type LoggerConfig = {
  /** Indica si la aplicación está ejecutándose en modo producción */
  isProduction: boolean;
  /** Nivel mínimo de logging que será registrado */
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  /** Directorio donde se almacenarán los archivos de log */
  logDir: string;
  /** Tamaño máximo de cada archivo de log en MB */
  logMaxSize: number;
  /** Número máximo de archivos de log a mantener */
  logMaxFiles: number;
  /** Frecuencia de rotación de archivos de log (daily, weekly, etc.) */
  logRotationFrequency?: string;
};

/**
 * Claves sensibles que deben ser censuradas en los logs por razones de seguridad.
 * Incluye patrones para contraseñas, tokens de autorización y cookies.
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
 * Factory de configuración del logger registrada con NestJS Config.
 * Carga la configuración desde variables de entorno con valores por defecto.
 *
 * @returns Configuración del logger con valores parseados desde el entorno
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
 * Crea las opciones de configuración para el módulo Pino HTTP logger.
 * Configura el transporte, formato, redacción de datos sensibles y propiedades personalizadas.
 *
 * @param config - Configuración del logger
 * @returns Parámetros de configuración para nestjs-pino
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
