import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';
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
   * Implementa una estrategia de manejo de errores en tres niveles:
   * 1. DomainBaseError: Errores controlados del dominio (pasar tal cual, logging en origen)
   * 2. GraphQLError: Errores nativos del framework GraphQL (log warn + pasar)
   * 3. Unknown: Errores completamente inesperados (log error + sanitizar)
   *
   * Los errores que extienden DomainBaseError (ApiReturnError, AppInternalError)
   * deben hacer logging en el punto donde se generan, no en este filtro.
   *
   * @public
   */
  catch(exception: unknown): void {
    // 1. Errores de dominio - Errores controlados que ya tienen el formato adecuado
    if (exception instanceof DomainBaseError) {
      // Pasar error de API tal cual al cliente
      throw exception;
    }

    // 2. Errores nativos de GraphQL - Errores del framework que no controlamos
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

    // 3. Errores desconocidos - Errores completamente inesperados que requieren investigación
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
