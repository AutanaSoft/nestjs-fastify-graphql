import { DomainBaseError } from '@/shared/domain/errors';
import { Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InfrastructureBaseError } from '../errors';

/**
 * @internal
 * @remarks Representa la estructura normalizada que se expone como error en GraphQL.
 */
interface ErrorResponse {
  message: string;
  extensions: {
    code: string;
    status: HttpStatus;
    [key: string]: unknown;
  };
}

@Catch()
export class GraphQLExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GraphQLExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * @public
   * @remarks Gestiona cualquier excepción lanzada en el flujo GraphQL y la transforma a un formato estándar.
   * @param exception Excepción recibida desde el resolver o capa de infraestructura.
   */
  catch(exception: unknown): void {
    // Manejo de errores personalizados del dominio, aplicación e infraestructura
    if (exception instanceof DomainBaseError || exception instanceof InfrastructureBaseError) {
      // Registro selectivo: únicamente se registran errores que no provienen del dominio
      if (!(exception instanceof DomainBaseError)) {
        /* this.logger.error({
          message: exception.message,
          extensions: exception.extensions,
          stack: exception instanceof Error ? exception.stack : undefined,
        }); */
      }

      throw exception;
    }

    // Manejo de errores nativos de GraphQL preservando metadatos
    if (exception instanceof GraphQLError) {
      this.logger.warn({
        message: exception.message,
        extensions: exception.extensions,
        stack: exception.stack,
      });

      throw exception;
    }

    // Para el resto de errores se realiza una normalización del mensaje y sus extensiones
    const errorResponse = this.normalizeError(exception);

    // Registro de detalles para errores que no provienen de GraphQL
    this.logger.error({
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Creación del error con el formato requerido por GraphQL
    const graphqlError = new GraphQLError(errorResponse.message, {
      extensions: {
        ...errorResponse.extensions,
      },
    });

    throw graphqlError;
  }

  /**
   * @remarks Convierte excepciones de NestJS u otras fuentes en un objeto compatible con GraphQL.
   * @param exception Excepción desconocida a estandarizar.
   * @returns ErrorResponse con campos listos para exponerse en GraphQL.
   */
  private normalizeError(exception: unknown): ErrorResponse {
    // Manejo de excepciones HTTP propias de NestJS
    if (exception instanceof HttpException) {
      const response = exception.getResponse() as string | Record<string, unknown>;

      let message: string;
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response.message === 'string') {
        message = response.message;
      } else if (Array.isArray(response.message)) {
        message = (response.message as string[]).join(', ');
      } else {
        message = exception.message;
      }

      return {
        message: String(message),
        extensions: {
          status: exception.getStatus(),
          code: exception.constructor.name.replace('Exception', '').toUpperCase(),
          extensions: typeof response === 'object' ? response : {},
        },
      };
    }

    // Manejo de errores desconocidos
    return {
      message: exception instanceof Error ? exception.message : 'Internal server error',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        error: exception instanceof Error ? exception.constructor.name : 'Unknown Error',
      },
    };
  }
}
