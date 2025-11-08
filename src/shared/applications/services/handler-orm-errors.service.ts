import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';
import { Injectable } from '@nestjs/common';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { GraphQLErrorOptions } from 'graphql';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { HANDLER_ORM_ERRORS_DEFAULT_CONFIG } from '../constants';
import { HandlerOrmErrorConfig, PrismaErrorMeta } from '../types';

@Injectable()
export class HandlerOrmErrorsService {
  constructor(
    @InjectPinoLogger(HandlerOrmErrorsService.name)
    private readonly logger: PinoLogger,
  ) {}

  public handleError(error: unknown, customConfig: HandlerOrmErrorConfig = {}): DomainBaseError {
    // Merge de configuración personalizada con defaults
    const config = this.mergeConfig(customConfig);

    this.logger.assign({ error });
    this.logger.debug('Handling Prisma error...');

    if (error instanceof PrismaClientKnownRequestError) {
      this.logger.debug('PrismaClientKnownRequestError detected');
      return this.handleKnownRequestError(error, config);
    }

    if (error instanceof PrismaClientValidationError) {
      this.logger.debug('PrismaClientValidationError detected');
      return this.extendWithOriginalError(
        ErrorFactory.createInternalServerError(config.validation.code, config.validation.message),
        this.buildGraphQLErrorOptions(error),
      );
    }

    if (error instanceof PrismaClientInitializationError) {
      this.logger.debug('PrismaClientInitializationError detected');
      return this.extendWithOriginalError(
        ErrorFactory.createInternalServerError(config.connection.code, config.connection.message),
        this.buildGraphQLErrorOptions(error),
      );
    }

    if (error instanceof PrismaClientRustPanicError) {
      this.logger.error('PrismaClientRustPanicError detected');
      return this.extendWithOriginalError(
        ErrorFactory.createInternalServerError(config.unknown.code, config.unknown.message),
        this.buildGraphQLErrorOptions(error),
      );
    }

    if (error instanceof PrismaClientUnknownRequestError) {
      this.logger.debug('PrismaClientUnknownRequestError detected');
      return this.extendWithOriginalError(
        ErrorFactory.createInternalServerError(config.unknown.code, config.unknown.message),
        this.buildGraphQLErrorOptions(error),
      );
    }

    return this.handleUnknownError(error, config);
  }

  private mergeConfig(customConfig: HandlerOrmErrorConfig): Required<HandlerOrmErrorConfig> {
    return {
      ...HANDLER_ORM_ERRORS_DEFAULT_CONFIG,
      ...customConfig,
    } as Required<HandlerOrmErrorConfig>;
  }

  private handleUnknownError(
    error: unknown,
    config: Required<HandlerOrmErrorConfig>,
  ): DomainBaseError {
    this.logger.assign({ method: 'handleUnknownError' });
    this.logger.error({ error }, 'Unknown Prisma error detected');
    return this.extendWithOriginalError(
      ErrorFactory.createInternalServerError(config.unknown.code, config.unknown.message),
      this.buildGraphQLErrorOptions(error),
    );
  }

  private handleKnownRequestError(
    error: PrismaClientKnownRequestError,
    config: Required<HandlerOrmErrorConfig>,
  ): DomainBaseError {
    const meta = (error.meta ?? {}) as PrismaErrorMeta;
    this.logger.assign({
      method: 'handleKnownRequestError',
      code: error.code,
      meta: {
        target: meta.target,
        modelName: meta.modelName,
        cause: meta.cause,
        constraint: meta.constraint,
      },
    });

    const context = {
      prismaCode: error.code,
      modelName: meta.modelName,
      target: meta.target,
      cause: meta.cause,
      constraint: meta.constraint,
    };

    const graphqlOptions = this.buildGraphQLErrorOptions(error);

    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return this.extendWithOriginalError(
          ErrorFactory.createConflictError(
            config.uniqueConstraint.code,
            config.uniqueConstraint.message,
            context,
          ),
          graphqlOptions,
        );
      case 'P2025': // Record not found
        return this.extendWithOriginalError(
          ErrorFactory.createNotFoundError(config.notFound.code, config.notFound.message, context),
          graphqlOptions,
        );
      case 'P2003': // Foreign key constraint violation
        return this.extendWithOriginalError(
          ErrorFactory.createInternalServerError(
            config.foreignKeyConstraint.code,
            config.foreignKeyConstraint.message,
            context,
          ),
          graphqlOptions,
        );
      case 'P2011': // Null constraint violation
      case 'P2012': // Missing required value
      case 'P2013': // Missing required argument
      case 'P2014': // Required relation violation
      case 'P2015': // Related record not found
      case 'P2019': // Input error
      case 'P2020': // Value out of range
        return this.extendWithOriginalError(
          ErrorFactory.createInternalServerError(
            config.validation.code,
            config.validation.message,
            context,
          ),
          graphqlOptions,
        );
      case 'P1001': // Can't reach database server
      case 'P1002': // Database server timeout
      case 'P1008': // Operations timed out
      case 'P1017': // Server has closed the connection
        return this.extendWithOriginalError(
          ErrorFactory.createInternalServerError(
            config.connection.code,
            config.connection.message,
            context,
          ),
          graphqlOptions,
        );
      default:
        return this.extendWithOriginalError(
          ErrorFactory.createInternalServerError(
            config.unknown.code,
            config.unknown.message,
            context,
          ),
          graphqlOptions,
        );
    }
  }

  private buildGraphQLErrorOptions(error: unknown): GraphQLErrorOptions | undefined {
    if (error instanceof Error) {
      return { originalError: error };
    }
    return undefined;
  }

  private extendWithOriginalError(
    domainError: DomainBaseError,
    graphqlOptions: GraphQLErrorOptions | undefined,
  ): DomainBaseError {
    if (graphqlOptions?.originalError) {
      // Extend the domain error with the original Prisma error
      Object.defineProperty(domainError, 'originalError', {
        value: graphqlOptions.originalError,
        enumerable: true,
        writable: false,
      });
    }
    return domainError;
  }
}
