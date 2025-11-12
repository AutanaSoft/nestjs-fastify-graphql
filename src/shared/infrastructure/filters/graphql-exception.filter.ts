import {
  ApiReturnError,
  AppInternalError,
  DataBaseError,
  DomainBaseError,
  ErrorFactory,
} from '@/shared/domain/errors';
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
   * Implementa una estrategia de manejo de errores en cinco niveles:
   * 1. ApiReturnError: Errores de cliente (validación, reglas de negocio) - pasar tal cual
   * 2. DataBaseError: Errores de persistencia - registrar y sanitizar
   * 3. AppInternalError: Errores internos - registrar y sanitizar completamente
   * 4. DomainBaseError: Otros errores de dominio - fallback genérico
   * 5. GraphQLError: Errores nativos del framework - log warn + pasar
   * 6. Unknown: Errores completamente inesperados - log error + sanitizar
   *
   * @public
   */
  catch(exception: unknown): void {
    // 1. Errores de API - Retornar al cliente tal cual (sin logging, se hace en origen)
    if (exception instanceof ApiReturnError) {
      throw exception;
    }

    // 2. Errores de base de datos - Registrar y sanitizar para el cliente
    if (exception instanceof DataBaseError) {
      this.logger.error(
        {
          error: exception,
          stack: exception.stack,
          code: exception.extensions?.code,
          status: exception.extensions?.status,
        },
        `Database Error: ${exception.message}`,
      );
      throw ErrorFactory.createInternalServerError();
    }

    // 3. Errores internos - Registrar y sanitizar completamente para el cliente
    if (exception instanceof AppInternalError) {
      this.logger.error(
        {
          error: exception,
          stack: exception.stack,
          code: exception.extensions?.code,
          status: exception.extensions?.status,
        },
        `Application Internal Error: ${exception.message}`,
      );
      throw ErrorFactory.createInternalServerError();
    }

    // 4. Otros errores de dominio - Fallback genérico para errores controlados
    if (exception instanceof DomainBaseError) {
      throw exception;
    }

    // 5. Errores nativos de GraphQL - Errores del framework que no controlamos
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

    // 6. Errores desconocidos - Errores completamente inesperados que requieren investigación
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

    throw ErrorFactory.createInternalServerError();
  }
}
