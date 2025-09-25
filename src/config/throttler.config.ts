import { registerAs } from '@nestjs/config';
import { seconds, ThrottlerModuleOptions } from '@nestjs/throttler';

export type ThrottlerConfig = {
  ttl: number;
  limit: number;
};

/**
 * @public
 * @remarks Expone la configuración del throttler leyendo variables de entorno y aplicando TTL en segundos.
 * @returns Configuración tipada para el módulo de throttling.
 */
export default registerAs('throttlerConfig', (): ThrottlerConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const _ttl = parseInt(process.env.THROTTLER_TTL || '60', 10);

  return {
    ttl: seconds(_ttl),
    limit: parseInt(
      process.env.THROTTLER_LIMIT || (isProduction ? '100' : '150'),
      10,
    ),
  };
});

/**
 * @public
 * @remarks Construye las opciones del ThrottlerModule utilizando la configuración tipada.
 * @param config Configuración proveniente del registro de throttler.
 * @returns Opciones listas para registrar en ThrottlerModule.forRoot.
 */
export const createThrottlerModuleOptions = (
  config: ThrottlerConfig,
): ThrottlerModuleOptions => ({
  throttlers: [
    {
      ttl: config.ttl,
      limit: config.limit,
    },
  ],
});
