/**
 * Mensajes predeterminados para errores comunes manejados desde el ORM.
 * @public
 */
export const HANDLER_ORM_ERRORS_DEFAULT_MESSAGE = {
  uniqueConstraint: 'duplicate key value violates unique constraint',
  notFound: 'Resource not found',
  foreignKeyConstraint: 'Invalid reference in data',
  validation: 'Invalid data provided',
  connection: 'Database unavailable',
  unknown: 'An unexpected error occurred',
};
