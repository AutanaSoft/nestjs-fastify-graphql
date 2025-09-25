import { GraphQLContext } from '@/config/graphql.config';
import { BaseDomainError } from '@/shared/domain/errors';
import {
  asHttpException,
  buildGraphQLError,
  mapHttpStatusToGraphqlCode,
  pickHttpMessage,
  toExtensions,
  withCorrelationId,
} from '@/shared/infrastructure/utils';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InfrastructureError } from '../errors';

/**
 * Normalized error response structure
 */
interface ErrorResponse {
  status: HttpStatus;
  message: string;
  code: string;
  extensions?: Record<string, unknown>;
}

/**
 * Global GraphQL exception filter following NestJS best practices
 * Handles all unhandled exceptions and transforms them into appropriate GraphQL errors
 */
@Catch()
export class GraphQLExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GraphQLExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Catches and processes all exceptions according to NestJS exception filter pattern
   * @param exception - The caught exception to process
   * @param host - The arguments host containing execution context
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    // Try to extract correlation ID from different contexts
    const correlationId = this.extractCorrelationId(host);

    // Handle our custom GraphQL errors (Domain, Application, Infrastructure)
    if (
      exception instanceof BaseDomainError ||
      exception instanceof InfrastructureError
    ) {
      // Selective logging: Only log infrastructure errors (domain errors are expected and not logged)
      if (exception instanceof InfrastructureError) {
        this.logger.error({
          message: exception.message,
          extensions: exception.extensions,
          stack: exception.stack,
          correlationId,
        });
      }

      // Add correlation ID to existing extensions and throw
      const enriched = withCorrelationId(
        exception as GraphQLError,
        correlationId,
      );
      throw enriched;
    }

    // Handle existing GraphQL errors (pass through with correlation ID)
    if (exception instanceof GraphQLError) {
      const enriched = withCorrelationId(exception, correlationId);
      // Adjust log level depending on code
      const code = (enriched.extensions?.code as string) ?? 'UNKNOWN';
      const level: 'info' | 'warn' =
        code === 'BAD_USER_INPUT' ? 'info' : 'warn';
      this.logger[level]({
        message: enriched.message,
        extensions: enriched.extensions,
        stack: enriched.stack,
        correlationId,
      });
      throw enriched;
    }

    // For other types of errors, normalize them
    const errorResponse = this.normalizeError(exception);

    // Log error details for non-GraphQL errors
    this.logger.error({
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
      correlationId,
    });

    // Create GraphQL formatted error
    const graphqlError = buildGraphQLError(errorResponse.message, {
      code: errorResponse.code,
      status: errorResponse.status,
      correlationId,
      extensions: errorResponse.extensions,
    });

    throw graphqlError;
  }

  /**
   * Normalizes non-GraphQL errors into a consistent format
   * @param exception The caught exception
   * @returns Normalized error response
   */
  private normalizeError(exception: unknown): ErrorResponse {
    // Handle NestJS HTTP exceptions
    const http = asHttpException(exception);
    if (http) {
      const response = http.getResponse() as string | Record<string, unknown>;
      const status = http.getStatus();
      const message = pickHttpMessage(response, http.message);
      const code = mapHttpStatusToGraphqlCode(status);
      return {
        status,
        message: String(message),
        code,
        extensions: toExtensions(response),
      };
    }

    // Handle unknown errors
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      extensions: {
        timestamp: new Date().toISOString(),
        error:
          exception instanceof Error
            ? exception.constructor.name
            : 'Unknown Error',
      },
    };
  }

  /**
   * Extracts correlation ID from GraphQL/Apollo Express context
   * @param host The arguments host containing execution context
   * @returns Correlation ID from headers or fallback
   */
  private extractCorrelationId(host: ArgumentsHost): string {
    const ctx = GqlArgumentsHost.create(host);
    const gqlContext = ctx.getContext<GraphQLContext>();
    const request = gqlContext?.req as {
      id?: string;
      headers?: Record<string, string | string[]>;
    };
    const headerId =
      (request?.headers?.['x-correlation-id'] as string) || undefined;
    return request?.id || headerId || 'no-correlation-id';
  }

  // enrichErrorWithCorrelationId has been deprecated in favor of withCorrelationId util
}
