import { HttpStatus } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { ApiReturnError, AppInternalError } from './domain-base.error';

/**
 * Parámetros para crear errores personalizados.
 */
type ErrorParameters = {
  message: string;
  code: string;
  options?: GraphQLErrorOptions;
};

/**
 * Fábrica para crear errores de dominio con contexto HTTP y GraphQL.
 *
 * @remarks
 * Proporciona métodos estáticos para crear errores específicos con códigos
 * de estado HTTP apropiados y extensiones GraphQL.
 *
 */
export class ErrorFactory {
  /**
   * Crea un error de API genérico.
   *
   * @param message - Mensaje de error legible
   * @param options - Opciones adicionales de GraphQL
   * @returns Instancia de ApiReturnError
   */
  private static createApiError(message: string, options?: GraphQLErrorOptions): ApiReturnError {
    return new ApiReturnError(message, options);
  }

  /**
   * Crea un error interno de aplicación.
   *
   * @param message - Mensaje de error legible
   * @param options - Opciones adicionales de GraphQL
   * @returns Instancia de AppInternalError
   */
  private static createAppError(message: string, options?: GraphQLErrorOptions): AppInternalError {
    return new AppInternalError(message, options);
  }

  /**
   * Crea un error de recurso no encontrado (404).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error con estado HTTP 404
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createNotFoundError({
   *   message: 'User with email john@example.com not found',
   *   code: 'USER_NOT_FOUND',
   *   options: { extensions: { email: 'john@example.com' } }
   * });
   * ```
   */
  static createNotFoundError(params: ErrorParameters): ApiReturnError {
    const { message, code, options } = params;
    return ErrorFactory.createApiError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: code || 'NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
      },
    });
  }

  /**
   * Crea un error de conflicto (409).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error con estado HTTP 409
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createConflictError({
   *   message: 'Email already registered',
   *   code: 'EMAIL_ALREADY_EXISTS',
   *   options: { extensions: { email: 'john@example.com' } }
   * });
   * ```
   */
  static createConflictError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    return ErrorFactory.createApiError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: code,
        status: HttpStatus.CONFLICT,
      },
    });
  }

  /**
   * Crea un error de acceso prohibido (403).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error con estado HTTP 403
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createForbiddenError({
   *   message: 'Insufficient permissions to access this resource',
   *   code: 'FORBIDDEN_ACCESS',
   *   options: { extensions: { userId: '123', resource: 'admin-panel' } }
   * });
   * ```
   */
  static createForbiddenError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    return ErrorFactory.createApiError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: code,
        status: HttpStatus.FORBIDDEN,
      },
    });
  }

  /**
   * Crea un error de autenticación requerida (401).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error con estado HTTP 401
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createUnauthorizedError({
   *   message: 'Invalid authentication token',
   *   code: 'INVALID_TOKEN',
   *   options: { extensions: { reason: 'expired' } }
   * });
   * ```
   */
  static createUnauthorizedError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    return ErrorFactory.createApiError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: code,
        status: HttpStatus.UNAUTHORIZED,
      },
    });
  }

  /**
   * Crea un error de solicitud incorrecta (400).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error con estado HTTP 400
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createBadRequestError({
   *   message: 'Invalid email format',
   *   code: 'INVALID_EMAIL',
   *   options: { extensions: { field: 'email', value: 'invalid-email' } }
   * });
   * ```
   */
  static createBadRequestError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    return ErrorFactory.createApiError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: code,
        status: HttpStatus.BAD_REQUEST,
      },
    });
  }

  /**
   * Crea un error interno del servidor (500).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error con estado HTTP 500
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createInternalServerError({
   *   message: 'Failed to process request',
   *   code: 'INTERNAL_ERROR',
   *   options: { extensions: { operation: 'createUser' } }
   * });
   * ```
   */

  /**
   * Crea un error interno del servidor con mensaje genérico.
   *
   * @param code - Código opcional incluido en las extensiones
   * @returns Instancia de ApiReturnError con estado 500
   *
   * @remarks
   * Si no se indica un código se usa INTERNAL_SERVER_ERROR por defecto.
   */
  static createInternalServerError(code?: string): ApiReturnError {
    const message = 'An unexpected error occurred. Please try again later.';
    return ErrorFactory.createApiError(message, {
      extensions: {
        code: code ?? 'INTERNAL_SERVER_ERROR',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  }

  /**
   * Crea un error de pasarela incorrecta (502).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error con estado HTTP 502
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createBadGatewayError({
   *   message: 'Payment gateway is unavailable',
   *   code: 'GATEWAY_UNAVAILABLE',
   *   options: { extensions: { service: 'stripe', endpoint: '/charge' } }
   * });
   * ```
   */
  static createBadGatewayError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    return ErrorFactory.createApiError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: code,
        status: HttpStatus.BAD_GATEWAY,
      },
    });
  }

  /**
   * Crea un error de base de datos (503).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error interno con estado HTTP 503
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createDataBaseError({
   *   message: 'Database connection timeout',
   *   code: 'DATABASE_TIMEOUT',
   *   options: { extensions: { operation: 'findUser', timeout: 5000 } }
   * });
   * ```
   */
  static createDataBaseError(parameters: ErrorParameters): AppInternalError {
    const { message, code, options } = parameters;
    return ErrorFactory.createAppError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: code,
        status: HttpStatus.SERVICE_UNAVAILABLE,
      },
    });
  }

  /**
   * Crea un error interno de aplicación (500).
   *
   * @param params.message - Mensaje de error legible
   * @param params.code - Código de error personalizado
   * @param params.options {GraphQLErrorOptions} - Opciones adicionales de GraphQL
   * @returns Error interno con estado HTTP 500
   *
   * @remarks
   * Este método es similar a createInternalServerError pero retorna un
   * AppInternalError en lugar de ApiReturnError, útil para errores internos
   * de la aplicación que no deben exponerse directamente al cliente.
   *
   * @example
   * ```typescript
   * throw ErrorFactory.createAppInternalError({
   *   message: 'Critical application error occurred',
   *   code: 'APP_CRITICAL_ERROR',
   *   options: { extensions: { component: 'auth-service', operation: 'validateToken' } }
   * });
   * ```
   */
  static createAppInternalError(parameters: ErrorParameters): AppInternalError {
    const { message, code, options } = parameters;
    return ErrorFactory.createAppError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: code,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  }
}
