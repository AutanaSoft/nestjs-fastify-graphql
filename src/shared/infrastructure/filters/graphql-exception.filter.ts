import { ApiReturnError, AppInternalError, ErrorFactory } from '@/shared/domain/errors';
import { Catch, ExceptionFilter } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
export class GraphQLExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GraphQLExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Gestiona cualquier excepción lanzada en el flujo GraphQL y la transforma a un formato estándar.
   *
   * @param exception - Excepción recibida desde el resolver o capa de infraestructura
   *
   * @remarks
   * Implementa una estrategia de manejo de errores en cuatro niveles:
   * 1. ApiReturnError: Errores esperados del cliente (log debug)
   * 2. AppInternalError: Errores críticos del sistema (log error + sanitizar)
   * 3. GraphQLError: Errores del framework GraphQL (log warn)
   * 4. Unknown: Errores completamente inesperados (log error + sanitizar)
   *
   * @public
   */
  catch(exception: unknown): void {
    // 1. Errores de API (cliente) - Errores esperados de validación y reglas de negocio
    if (exception instanceof ApiReturnError) {
      this.logger.debug(
        {
          code: exception.extensions?.code,
          status: exception.extensions?.status,
          method: exception.extensions?.method,
          service: exception.extensions?.service,
        },
        `API Error: ${exception.message}`,
      );
      throw exception;
    }

    // 2. Errores internos del sistema - Errores críticos que requieren investigación
    if (exception instanceof AppInternalError) {
      const error = exception?.originalError || exception.extensions?.originalError;
      this.logger.error(
        {
          code: exception.extensions?.code,
          status: exception.extensions?.status,
          service: exception.extensions?.service,
          method: exception.extensions?.method,
          error,
          stack: error instanceof Error ? error.stack : undefined,
        },
        `Internal System Error: ${exception.message}`,
      );

      // Devuelve error genérico al cliente sin exponer detalles internos
      throw ErrorFactory.createInternalServerError({
        message: 'An unexpected error occurred. Please try again later.',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }

    // 3. Errores nativos de GraphQL - Errores del framework (sintaxis, validación, etc.)
    if (exception instanceof GraphQLError) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.warn(
        {
          error: exception,
          stack,
          code: exception.extensions?.code,
          status: exception.extensions?.status,
        },
        `GraphQL Error: ${exception.message}`,
      );
      throw exception;
    }

    // 4. Errores desconocidos - Errores completamente inesperados
    const error = exception instanceof Error ? exception : undefined;
    const errorMessage = error ? error.message : 'Non-error thrown';
    const stack = error ? error.stack : undefined;

    this.logger.error(
      {
        error,
        stack,
      },
      `Unknown Error: ${errorMessage}`,
    );

    throw ErrorFactory.createInternalServerError({
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
