import { HttpStatus } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { DomainBaseError } from './domain-base.error';

/**
 * Contexto adicional para los errores de dominio.
 *
 * @public
 */
export type ErrorContext = Record<string, any>;

/**
 * Configuración base para crear errores de dominio.
 *
 * @public
 */
export interface ErrorConfig {
  /** Código único del error en SCREAMING_SNAKE_CASE */
  code: string;
  /** Status HTTP usando HttpStatus enum */
  status: HttpStatus;
  /** Mensaje descriptivo del error */
  message: string;
  /** Contexto adicional del error (ids, valores relevantes, etc.) */
  context?: ErrorContext;
  /** Opciones adicionales de GraphQL */
  options?: GraphQLErrorOptions;
}

/**
 * Factory centralizado para la creación de errores de dominio con configuración estándar.
 *
 * @remarks
 * Este factory proporciona métodos estáticos para crear errores de dominio consistentes
 * con el código HTTP apropiado, mensaje descriptivo y contexto adicional.
 *
 * **Ventajas sobre crear clases específicas**:
 * - Reducción de boilerplate (~15 líneas por error → 1 llamada)
 * - Consistencia: todos los errores siguen la misma estructura
 * - Flexibilidad: cualquier módulo puede crear errores sin duplicar código
 * - Mantenibilidad: cambios en la estructura se hacen en un solo lugar
 * - Type-safety: TypeScript valida los parámetros
 *
 * **Métodos disponibles**:
 * - {@link createDomainError} - Método base genérico (usado internamente)
 * - {@link createNotFoundError} - 404 NOT_FOUND
 * - {@link createConflictError} - 409 CONFLICT
 * - {@link createForbiddenError} - 403 FORBIDDEN
 * - {@link createUnauthorizedError} - 401 UNAUTHORIZED
 * - {@link createBadRequestError} - 400 BAD_REQUEST
 * - {@link createInternalServerError} - 500 INTERNAL_SERVER_ERROR
 * - {@link createBadGatewayError} - 502 BAD_GATEWAY
 *
 * @example
 * ```typescript
 * // En cualquier módulo - Error NOT_FOUND
 * throw ErrorFactory.createNotFoundError(
 *   'USER_NOT_FOUND',
 *   `User with ID ${id} not found`,
 *   { userId: id }
 * );
 *
 * // Error CONFLICT
 * throw ErrorFactory.createConflictError(
 *   'EMAIL_ALREADY_EXISTS',
 *   `User with email ${email} already exists`,
 *   { email }
 * );
 * ```
 *
 * @see {@link DomainBaseError} - Clase base de errores de dominio
 * @public
 */
export class ErrorFactory {
  /**
   * Crea un error de dominio con la configuración especificada.
   *
   * @param config - Configuración completa del error
   * @returns Nueva instancia de DomainBaseError
   *
   * @remarks
   * Este es el método base que todos los demás métodos utilizan internamente.
   * Úsalo cuando necesites control total sobre el error.
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createDomainError({
   *   code: 'PAYMENT_PROCESSING_FAILED',
   *   status: HttpStatus.BAD_GATEWAY,
   *   message: 'Payment gateway is unavailable',
   *   context: { gatewayName: 'Stripe', orderId: '123' }
   * });
   * ```
   */
  static createDomainError(config: ErrorConfig): DomainBaseError {
    return new DomainBaseError(config.message, {
      ...config.options,
      extensions: {
        code: config.code,
        status: config.status,
        ...config.context,
        ...config.options?.extensions,
      },
    });
  }

  /**
   * Crea un error de recurso no encontrado (404 NOT_FOUND).
   *
   * @param code - Código del error en SCREAMING_SNAKE_CASE
   * @param message - Mensaje descriptivo del error
   * @param context - Contexto adicional (ids, filtros usados, etc.)
   * @returns Error de dominio con status 404
   *
   * @example
   * ```typescript
   * // Uso directo
   * throw ErrorFactory.createNotFoundError(
   *   'USER_NOT_FOUND',
   *   'User not found with id: 123',
   *   { userId: '123' }
   * );
   *
   * // Uso en helper
   * export const createUserNotFoundError = (id: string) =>
   *   ErrorFactory.createNotFoundError(
   *     'USER_NOT_FOUND',
   *     `User not found with id: ${id}`,
   *     { userId: id }
   *   );
   * ```
   */
  static createNotFoundError(
    code: string,
    message: string,
    context?: ErrorContext,
  ): DomainBaseError {
    return ErrorFactory.createDomainError({
      code,
      status: HttpStatus.NOT_FOUND,
      message,
      context,
    });
  }

  /**
   * Crea un error de conflicto (409 CONFLICT).
   *
   * @param code - Código del error en SCREAMING_SNAKE_CASE
   * @param message - Mensaje descriptivo del error
   * @param context - Contexto adicional (campo duplicado, valor, etc.)
   * @returns Error de dominio con status 409
   *
   * @remarks
   * Usa este error para:
   * - Violaciones de restricción única (email duplicado, username duplicado)
   * - Conflictos de estado (recurso ya procesado, ya verificado, etc.)
   * - Violaciones de reglas de negocio
   *
   * @example
   * ```typescript
   * // Recurso duplicado
   * throw ErrorFactory.createConflictError(
   *   'USER_ALREADY_EXISTS',
   *   'User with this email already exists',
   *   { email: 'john@example.com' }
   * );
   *
   * // Estado inválido
   * throw ErrorFactory.createConflictError(
   *   'EMAIL_ALREADY_VERIFIED',
   *   'Email is already verified',
   *   { userId: '123', emailVerified: true }
   * );
   * ```
   */
  static createConflictError(
    code: string,
    message: string,
    context?: ErrorContext,
  ): DomainBaseError {
    return ErrorFactory.createDomainError({
      code,
      status: HttpStatus.CONFLICT,
      message,
      context,
    });
  }

  /**
   * Crea un error de prohibición (403 FORBIDDEN).
   *
   * @param code - Código del error en SCREAMING_SNAKE_CASE
   * @param message - Mensaje descriptivo del error
   * @param context - Contexto adicional (permisos requeridos, recurso, etc.)
   * @returns Error de dominio con status 403
   *
   * @remarks
   * Usa este error para:
   * - Falta de permisos para acceder a un recurso
   * - Intentar acceder a recursos que no pertenecen al usuario
   * - Operaciones bloqueadas por políticas de negocio
   *
   * @example
   * ```typescript
   * // Falta de permisos
   * throw ErrorFactory.createForbiddenError(
   *   'INSUFFICIENT_PERMISSIONS',
   *   'You do not have permission to delete this user',
   *   { requiredPermission: 'user:delete:all', userId: '123' }
   * );
   *
   * // Recurso no pertenece al usuario
   * throw ErrorFactory.createForbiddenError(
   *   'UNAUTHORIZED_RESOURCE_ACCESS',
   *   'You do not have access to this resource',
   *   { resourceType: 'post', resourceId: '456', userId: '123' }
   * );
   * ```
   */
  static createForbiddenError(
    code: string,
    message: string,
    context?: ErrorContext,
  ): DomainBaseError {
    return ErrorFactory.createDomainError({
      code,
      status: HttpStatus.FORBIDDEN,
      message,
      context,
    });
  }

  /**
   * Crea un error de autenticación requerida (401 UNAUTHORIZED).
   *
   * @param code - Código del error en SCREAMING_SNAKE_CASE
   * @param message - Mensaje descriptivo del error
   * @param context - Contexto adicional (tipo de token, motivo, etc.)
   * @returns Error de dominio con status 401
   *
   * @remarks
   * Usa este error para:
   * - Credenciales inválidas
   * - Token expirado o inválido
   * - Sesión expirada
   * - Autenticación requerida pero no provista
   *
   * @example
   * ```typescript
   * // Credenciales inválidas
   * throw ErrorFactory.createUnauthorizedError(
   *   'INVALID_CREDENTIALS',
   *   'Invalid email or password',
   *   { email: 'john@example.com' }
   * );
   *
   * // Token expirado
   * throw ErrorFactory.createUnauthorizedError(
   *   'TOKEN_EXPIRED',
   *   'Authentication token has expired',
   *   { tokenType: 'access_token' }
   * );
   * ```
   */
  static createUnauthorizedError(
    code: string,
    message: string,
    context?: ErrorContext,
  ): DomainBaseError {
    return ErrorFactory.createDomainError({
      code,
      status: HttpStatus.UNAUTHORIZED,
      message,
      context,
    });
  }

  /**
   * Crea un error de solicitud inválida (400 BAD_REQUEST).
   *
   * @param code - Código del error en SCREAMING_SNAKE_CASE
   * @param message - Mensaje descriptivo del error
   * @param context - Contexto adicional (campos inválidos, valores, etc.)
   * @returns Error de dominio con status 400
   *
   * @remarks
   * Usa este error para:
   * - Errores de validación de entrada
   * - Parámetros faltantes o inválidos
   * - Formato de datos incorrecto
   * - Valores fuera de rango permitido
   *
   * @example
   * ```typescript
   * // Validación simple
   * throw ErrorFactory.createBadRequestError(
   *   'INVALID_EMAIL_FORMAT',
   *   'Email format is invalid',
   *   { email: 'invalid-email' }
   * );
   *
   * // Validación múltiple (usa createValidationError en su lugar)
   * throw ErrorFactory.createBadRequestError(
   *   'VALIDATION_FAILED',
   *   'Multiple validation errors occurred',
   *   { fields: ['email', 'password'] }
   * );
   * ```
   */
  static createBadRequestError(
    code: string,
    message: string,
    context?: ErrorContext,
  ): DomainBaseError {
    return ErrorFactory.createDomainError({
      code,
      status: HttpStatus.BAD_REQUEST,
      message,
      context,
    });
  }

  /**
   * Crea un error de servidor interno (500 INTERNAL_SERVER_ERROR).
   *
   * @param code - Código del error en SCREAMING_SNAKE_CASE
   * @param message - Mensaje descriptivo del error
   * @param context - Contexto adicional (operación fallida, detalles, etc.)
   * @returns Error de dominio con status 500
   *
   * @remarks
   * Usa este error para:
   * - Errores inesperados del servidor
   * - Fallas en operaciones de base de datos
   * - Errores de cifrado/descifrado
   * - Problemas de configuración
   *
   * @example
   * ```typescript
   * // Error de base de datos
   * throw ErrorFactory.createInternalServerError(
   *   'DATABASE_ERROR',
   *   'Failed to execute database operation',
   *   { operation: 'update', table: 'users' }
   * );
   *
   * // Error de cifrado
   * throw ErrorFactory.createInternalServerError(
   *   'ENCRYPTION_FAILED',
   *   'Failed to encrypt sensitive data',
   *   { field: 'email' }
   * );
   * ```
   */
  static createInternalServerError(
    code: string,
    message: string,
    context?: ErrorContext,
  ): DomainBaseError {
    return ErrorFactory.createDomainError({
      code,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      context,
    });
  }

  /**
   * Crea un error de servicio externo no disponible (502 BAD_GATEWAY).
   *
   * @param code - Código del error en SCREAMING_SNAKE_CASE
   * @param message - Mensaje descriptivo del error
   * @param context - Contexto adicional (servicio, operación, etc.)
   * @returns Error de dominio con status 502
   *
   * @remarks
   * Usa este error para:
   * - Servicios externos no disponibles
   * - Timeouts en llamadas externas
   * - Errores de API de terceros
   * - Servicios de email, SMS, pagos, etc. fallidos
   *
   * @example
   * ```typescript
   * // Servicio de email
   * throw ErrorFactory.createBadGatewayError(
   *   'EMAIL_SERVICE_UNAVAILABLE',
   *   'Failed to send email: service unavailable',
   *   { service: 'SendGrid', recipient: 'john@example.com' }
   * );
   *
   * // API de terceros
   * throw ErrorFactory.createBadGatewayError(
   *   'PAYMENT_GATEWAY_ERROR',
   *   'Payment gateway returned an error',
   *   { gateway: 'Stripe', errorCode: 'card_declined' }
   * );
   * ```
   */
  static createBadGatewayError(
    code: string,
    message: string,
    context?: ErrorContext,
  ): DomainBaseError {
    return ErrorFactory.createDomainError({
      code,
      status: HttpStatus.BAD_GATEWAY,
      message,
      context,
    });
  }
}
