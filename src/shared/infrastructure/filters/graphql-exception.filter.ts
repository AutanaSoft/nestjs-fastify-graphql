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
    // Manejo de errores personalizados del dominio e infraestructura
    if (exception instanceof DomainBaseError || exception instanceof InfrastructureBaseError) {
      // Los errores de dominio NO se registran (son errores de negocio esperados)
      // Los errores de infraestructura SÍ se registran (requieren atención)
      if (exception instanceof InfrastructureBaseError) {
        this.logger.error({
          message: exception.message,
          extensions: exception.extensions,
          stack: exception.stack,
        });
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
      } else if (typeof response === 'object' && response !== null) {
        // Manejo robusto de diferentes formatos de mensaje
        if (typeof response.message === 'string') {
          message = response.message;
        } else if (Array.isArray(response.message)) {
          // Validar que todos los elementos sean strings antes de hacer join
          const messages = response.message.filter((msg) => typeof msg === 'string');
          message = messages.length > 0 ? messages.join(', ') : exception.message;
        } else {
          message = exception.message;
        }
      } else {
        message = exception.message;
      }

      return {
        message: String(message),
        extensions: {
          status: exception.getStatus(),
          code: exception.constructor.name.replace('Exception', '').toUpperCase(),
          ...(typeof response === 'object' && response !== null ? response : {}),
        },
      };
    }

    // Manejo de errores desconocidos
    const errorName = exception instanceof Error ? exception.constructor.name : 'Unknown';
    const errorCode =
      errorName !== 'Error' && errorName !== 'Unknown'
        ? errorName.replace(/Error$/, '').toUpperCase() || 'INTERNAL_SERVER_ERROR'
        : 'INTERNAL_SERVER_ERROR';

    return {
      message: exception instanceof Error ? exception.message : 'Internal server error',
      extensions: {
        code: errorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        errorType: errorName,
      },
    };
  }
}
