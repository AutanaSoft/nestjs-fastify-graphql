import { HandlerOrmErrorConfig } from '@/shared/applications/types';

/**
 * Configuración personalizada de errores de ORM para el módulo de usuarios.
 *
 * @remarks
 * Define códigos y mensajes específicos del dominio de usuarios para errores
 * de base de datos. Estos valores sobrescriben los defaults del HandlerOrmErrorsService
 * cuando se capturan errores en los adaptadores de persistencia de usuarios.
 *
 * **Uso en repositorio:**
 * ```typescript
 * try {
 *   return await this.prisma.user.create({ data });
 * } catch (error) {
 *   return this.handlerOrmErrors.handleError(error, USER_ORM_ERROR_CONFIG);
 * }
 * ```
 *
 * @public
 */
export const USER_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: {
    code: 'USER_ALREADY_EXISTS',
    message: 'A user with this email or username already exists',
  },
  notFound: {
    code: 'USER_NOT_FOUND',
    message: 'The requested user was not found',
  },
  foreignKeyConstraint: {
    code: 'USER_INVALID_REFERENCE',
    message: 'Invalid reference to related user data',
  },
  validation: {
    code: 'USER_VALIDATION_ERROR',
    message: 'The user data provided is invalid',
  },
  // connection y unknown usan los defaults del servicio
};
