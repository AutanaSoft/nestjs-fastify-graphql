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
   * Implementa una estrategia de manejo de errores en seis niveles:
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
      this.logError(exception, 'error', 'Database Error');
      throw ErrorFactory.createInternalServerError();
    }

    // 3. Errores internos - Registrar y sanitizar completamente para el cliente
    if (exception instanceof AppInternalError) {
      this.logError(exception, 'error', 'Application Internal Error');
      throw ErrorFactory.createInternalServerError();
    }

    // 4. Otros errores de dominio - Fallback genérico para errores controlados
    if (exception instanceof DomainBaseError) {
      throw exception;
    }

    // 5. Errores nativos de GraphQL - Errores del framework que no controlamos
    if (exception instanceof GraphQLError) {
      this.logger.warn(
        {
          error: exception,
          stack: exception.stack,
          code: exception.extensions?.code,
          status: exception.extensions?.status,
        },
        `GraphQL Error: ${exception.message}`,
      );
      throw exception;
    }

    // 6. Errores desconocidos - Errores completamente inesperados que requieren investigación
    this.logUnknownError(exception);
    throw ErrorFactory.createInternalServerError();
  }

  /**
   * Registra errores de dominio con contexto completo.
   *
   * @param exception - Error de dominio a registrar
   * @param level - Nivel de logging ('error' o 'warn')
   * @param prefix - Prefijo descriptivo para el mensaje de log
   *
   * @private
   */
  private logError(exception: DomainBaseError, level: 'error' | 'warn', prefix: string): void {
    this.logger[level](
      {
        error: exception,
        stack: exception.stack,
        code: exception.extensions?.code,
        status: exception.extensions?.status,
      },
      `${prefix}: ${exception.message}`,
    );
  }

  /**
   * Registra errores desconocidos que no son instancias de Error.
   *
   * @param exception - Excepción desconocida a registrar
   *
   * @private
   */
  private logUnknownError(exception: unknown): void {
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
  }
}
