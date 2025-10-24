import { HandlerOrmErrorConfig } from '../types';

/**
 * Configuración predeterminada para errores de ORM.
 *
 * @remarks
 * Proporciona códigos y mensajes por defecto para todos los tipos de errores
 * de base de datos manejados por HandlerOrmErrorsService. Estos valores se usan
 * cuando un módulo no proporciona configuración personalizada.
 *
 * Los códigos siguen el patrón: DATABASE_{TIPO}_ERROR
 * Los mensajes son genéricos y orientados al usuario final.
 *
 * @public
 */
export const HANDLER_ORM_ERRORS_DEFAULT_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: {
    code: 'DATABASE_UNIQUE_CONSTRAINT_VIOLATION',
    message: 'A record with this value already exists',
  },
  notFound: {
    code: 'DATABASE_RECORD_NOT_FOUND',
    message: 'The requested resource was not found',
  },
  foreignKeyConstraint: {
    code: 'DATABASE_FOREIGN_KEY_CONSTRAINT_VIOLATION',
    message: 'Invalid reference to related data',
  },
  validation: {
    code: 'DATABASE_VALIDATION_ERROR',
    message: 'The provided data is invalid',
  },
  connection: {
    code: 'DATABASE_CONNECTION_ERROR',
    message: 'Unable to connect to the database',
  },
  unknown: {
    code: 'DATABASE_UNKNOWN_ERROR',
    message: 'An unexpected database error occurred',
  },
};
