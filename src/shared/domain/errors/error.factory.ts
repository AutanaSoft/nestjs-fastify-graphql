import { HttpStatus } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { ApiReturnError, AppInternalError, DataBaseError } from './domain-base.error';

type ErrorParameters = {
  readonly message: string;
  readonly code?: string;
  readonly options?: GraphQLErrorOptions;
};
/**
 * Fabrica errores de GraphQL con metadatos HTTP consistentes.
 * @public
 */
export class ErrorFactory {
  private static setApiReturnError(message: string, options?: GraphQLErrorOptions): ApiReturnError {
    return new ApiReturnError(message, options);
  }

  private static setDataBaseError(message: string, options?: GraphQLErrorOptions): DataBaseError {
    return new DataBaseError(message, options);
  }

  private static setAppInternalError(
    message: string,
    options?: GraphQLErrorOptions,
  ): AppInternalError {
    return new AppInternalError(message, options);
  }

  /**
   * Crea un error 404 para recursos no encontrados.
   * @param params Datos del error.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createNotFoundError(params: ErrorParameters): ApiReturnError {
    const { message, code, options } = params;
    const resolvedCode = code ?? 'NOT_FOUND';
    return ErrorFactory.setApiReturnError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.NOT_FOUND,
      },
    });
  }

  /**
   * Crea un error 409 para conflictos de estado.
   * @param parameters Datos del error.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createConflictError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    const resolvedCode = code ?? 'CONFLICT';
    return ErrorFactory.setApiReturnError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.CONFLICT,
      },
    });
  }

  /**
   * Crea un error 403 para accesos prohibidos.
   * @param parameters Datos del error.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createForbiddenError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    const resolvedCode = code ?? 'FORBIDDEN';
    return ErrorFactory.setApiReturnError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.FORBIDDEN,
      },
    });
  }

  /**
   * Crea un error 401 para accesos no autorizados.
   * @param parameters Datos del error.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createUnauthorizedError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    const resolvedCode = code ?? 'UNAUTHORIZED';
    return ErrorFactory.setApiReturnError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.UNAUTHORIZED,
      },
    });
  }

  /**
   * Crea un error 400 para solicitudes inválidas.
   * @param parameters Datos del error.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createBadRequestError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    const resolvedCode = code ?? 'BAD_REQUEST';
    return ErrorFactory.setApiReturnError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.BAD_REQUEST,
      },
    });
  }

  /**
   * Crea un error 500 interno genérico.
   * @param code Código de error opcional.
   * @param options Opciones adicionales para GraphQL.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createInternalServerError(code?: string, options?: GraphQLErrorOptions): ApiReturnError {
    const resolvedCode = code ?? 'INTERNAL_SERVER_ERROR';
    const message = 'An unexpected error occurred. Please try again later.';
    return ErrorFactory.setApiReturnError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  }

  /**
   * Crea un error 502 para fallas de servicios externos.
   * @param parameters Datos del error.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createBadGatewayError(parameters: ErrorParameters): ApiReturnError {
    const { message, code, options } = parameters;
    const resolvedCode = code ?? 'BAD_GATEWAY';
    return ErrorFactory.setApiReturnError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.BAD_GATEWAY,
      },
    });
  }

  /**
   * Crea un error de base de datos con estado 503.
   * @param parameters Datos del error.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createDataBaseError(parameters: ErrorParameters): DataBaseError {
    const { message, code, options } = parameters;
    const resolvedCode = code ?? 'DATABASE_ERROR';
    return ErrorFactory.setDataBaseError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.SERVICE_UNAVAILABLE,
      },
    });
  }

  /**
   * Crea un error interno propio de la aplicación.
   * @param parameters Datos del error.
   * @returns Error configurado con extensiones GraphQL.
   */
  static createAppInternalError(parameters: ErrorParameters): AppInternalError {
    const { message, code, options } = parameters;
    const resolvedCode = code ?? 'APP_INTERNAL_ERROR';
    return ErrorFactory.setAppInternalError(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: resolvedCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    });
  }
}
