import { registerAs } from '@nestjs/config';
import { seconds, ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Configuración de rate limiting (throttler) para la aplicación.
 *
 * @property ttl - Tiempo de vida en milisegundos para el contador de solicitudes
 * @property limit - Número máximo de solicitudes permitidas en el período ttl
 */
export type ThrottlerConfig = {
  ttl: number;
  limit: number;
};

/**
 * Genera la configuración del throttler a partir de variables de entorno.
 *
 * Lee las variables THROTTLER_TTL y THROTTLER_LIMIT, aplicando valores por
 * defecto según el entorno (producción o desarrollo).
 *
 * @returns Configuración del throttler con ttl y limit
 */
export const throttlerConfigFactory = (): ThrottlerConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const _ttl = parseInt(process.env.THROTTLER_TTL || '60', 10);

  return {
    ttl: seconds(_ttl),
    limit: parseInt(process.env.THROTTLER_LIMIT || (isProduction ? '100' : '150'), 10),
  };
};

export default registerAs('throttlerConfig', (): ThrottlerConfig => throttlerConfigFactory());

/**
 * Crea las opciones del módulo ThrottlerModule a partir de la configuración.
 *
 * Transforma la configuración de throttler en el formato requerido por
 * el módulo de NestJS.
 *
 * @param config - Configuración del throttler
 * @returns Opciones del módulo con el array de throttlers configurados
 */
export const createThrottlerModuleOptions = (config: ThrottlerConfig): ThrottlerModuleOptions => ({
  throttlers: [
    {
      ttl: config.ttl,
      limit: config.limit,
    },
  ],
});
