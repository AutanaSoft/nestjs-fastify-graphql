import { HandlerOrmErrorConfig } from '@/shared/applications/types';

/**
 * Configuración personalizada de errores de ORM para el módulo de permisos.
 *
 * @remarks
 * Define códigos y mensajes específicos del dominio de permisos para errores
 * de base de datos. Estos valores sobrescriben los defaults del HandlerOrmErrorsService
 * cuando se capturan errores en los adaptadores de persistencia de permisos.
 *
 * **Uso en repositorio:**
 * ```typescript
 * try {
 *   return await this.prisma.permission.findMany({ where });
 * } catch (error) {
 *   return this.handlerOrmErrors.handleError(error, PERMISSION_ORM_ERROR_CONFIG);
 * }
 * ```
 *
 * @public
 */
export const PERMISSION_ORM_ERROR_CONFIG: HandlerOrmErrorConfig = {
  uniqueConstraint: {
    code: 'PERMISSION_ALREADY_ASSIGNED',
    message: 'This permission is already assigned to the user',
  },
  notFound: {
    code: 'PERMISSION_NOT_FOUND',
    message: 'The requested permission does not exist',
  },
  foreignKeyConstraint: {
    code: 'INVALID_USER_OR_PERMISSION',
    message: 'The user or permission reference is invalid',
  },
  validation: {
    code: 'PERMISSION_VALIDATION_ERROR',
    message: 'The permission data provided is invalid',
  },
  // connection y unknown usan los defaults del servicio
};
