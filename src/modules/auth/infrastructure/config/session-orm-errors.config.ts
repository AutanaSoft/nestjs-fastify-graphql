import { HandlerOrmErrorConfig } from '@/shared/applications/types';

/**
 * Configuración personalizada de errores de ORM para el módulo de sesiones.
 *
 * @remarks
 * Define códigos y mensajes específicos del dominio de sesiones para errores
 * de base de datos. Estos valores sobrescriben los defaults del HandlerOrmErrorsService
 * cuando se capturan errores en los adaptadores de persistencia de sesiones.
 *
 * **Uso en repositorio:**
 * ```typescript
 * try {
 *   return await this.prisma.session.create({ data });
 * } catch (error) {
 *   return this.handlerOrmErrors.handleError(error, SESSION_ORM_ERROR_CONFIG);
 * }
 * ```
 *
 * @public
 */
export const SESSION_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: {
    code: 'SESSION_ALREADY_EXISTS',
    message: 'A session with this refresh token already exists',
  },
  notFound: {
    code: 'SESSION_NOT_FOUND',
    message: 'Session not found or already deleted',
  },
  foreignKeyConstraint: {
    code: 'INVALID_USER_OR_SESSION',
    message: 'Referenced user does not exist or foreign key constraint violated',
  },
  validation: {
    code: 'SESSION_VALIDATION_ERROR',
    message: 'Session data validation failed. Check refresh token hash, dates, and session type',
  },
  // connection y unknown usan los defaults del servicio
};
