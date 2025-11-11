import { HandlerOrmErrorConfig } from '../types';

/**
 * Configuración predeterminada para errores de ORM.
 *
 * @remarks
 * Proporciona códigos y mensajes por defecto para errores de base de datos.
 * Solo se manejan errores de negocio esperados (P2002, P2025).
 * Todos los demás errores técnicos retornan un error interno genérico.
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
  internalError: {
    code: 'DATABASE_INTERNAL_ERROR',
    message: 'An unexpected database error occurred',
  },
};
