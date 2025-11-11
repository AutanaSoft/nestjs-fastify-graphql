import { registerAs } from '@nestjs/config';

/**
 * Configuración del módulo EventEmitter.
 *
 * @public
 * @property {boolean} wildcard - Habilita el uso de wildcards en nombres de eventos (user.*)
 * @property {string} delimiter - Delimitador para eventos anidados (ej: 'user.created')
 * @property {boolean} newListener - Emite eventos cuando se registran nuevos listeners
 * @property {boolean} removeListener - Emite eventos cuando se eliminan listeners
 * @property {number} maxListeners - Máximo de listeners por evento (0 = sin límite)
 * @property {boolean} verboseMemoryLeak - Muestra advertencias detalladas sobre memory leaks
 * @property {boolean} ignoreErrors - Ignora errores en listeners (no recomendado en producción)
 */
export type EventEmitterConfig = {
  readonly wildcard: boolean;
  readonly delimiter: string;
  readonly newListener: boolean;
  readonly removeListener: boolean;
  readonly maxListeners: number;
  readonly verboseMemoryLeak: boolean;
  readonly ignoreErrors: boolean;
};

/**
 * Factoría que genera la configuración de EventEmitter según el entorno.
 *
 * Lee variables de entorno prefijadas con `EVENT_EMITTER_` para personalizar
 * el comportamiento del sistema de eventos. Proporciona valores por defecto
 * seguros para desarrollo y producción.
 *
 * @returns {EventEmitterConfig} Configuración completa del EventEmitter
 */
export const eventEmitterConfigFactory = (): EventEmitterConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    wildcard: process.env.EVENT_EMITTER_WILDCARD === 'true' || false,
    delimiter: process.env.EVENT_EMITTER_DELIMITER || '.',
    newListener: process.env.EVENT_EMITTER_NEW_LISTENER === 'true' || false,
    removeListener: process.env.EVENT_EMITTER_REMOVE_LISTENER === 'true' || false,
    maxListeners: parseInt(process.env.EVENT_EMITTER_MAX_LISTENERS || '10', 10),
    verboseMemoryLeak: !isProduction,
    ignoreErrors: false,
  };
};

/**
 * Registro de configuración tipado para el módulo EventEmitter.
 *
 * Permite inyección tipada mediante `@Inject(eventEmitterConfig.KEY)` o
 * `ConfigService.get<EventEmitterConfig>('eventEmitterConfig')`.
 *
 * @public
 */
export default registerAs(
  'eventEmitterConfig',
  (): EventEmitterConfig => eventEmitterConfigFactory(),
);
