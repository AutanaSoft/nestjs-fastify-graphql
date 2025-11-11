import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';
import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
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
    const config = this.mergeConfig(customConfig);

    if (error instanceof PrismaClientKnownRequestError) {
      return this.handleKnownRequestError(error, config);
    }

    // Todos los demás errores son técnicos - enriquecer solo en el log
    this.logger.error(
      {
        error,
        errorType: error?.constructor?.name,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Technical database error',
    );

    return ErrorFactory.createAppInternalError({
      code: config.internalError.code,
      message: config.internalError.message,
    });
  }

  private mergeConfig(customConfig: HandlerOrmErrorConfig): Required<HandlerOrmErrorConfig> {
    return {
      ...HANDLER_ORM_ERRORS_DEFAULT_CONFIG,
      ...customConfig,
    } as Required<HandlerOrmErrorConfig>;
  }

  private handleKnownRequestError(
    error: PrismaClientKnownRequestError,
    config: Required<HandlerOrmErrorConfig>,
  ): DomainBaseError {
    const meta = (error.meta ?? {}) as PrismaErrorMeta;

    // Errores de negocio esperados
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        this.logger.debug(
          {
            code: error.code,
            modelName: meta.modelName,
            target: meta.target,
            constraint: meta.constraint,
          },
          'Unique constraint violation detected',
        );
        return ErrorFactory.createConflictError({
          code: config.uniqueConstraint.code,
          message: config.uniqueConstraint.message,
        });

      case 'P2025': // Record not found
        this.logger.debug(
          {
            code: error.code,
            modelName: meta.modelName,
            cause: meta.cause,
          },
          'Record not found',
        );
        return ErrorFactory.createNotFoundError({
          code: config.notFound.code,
          message: config.notFound.message,
        });

      // Todos los demás errores de Prisma son técnicos
      default:
        this.logger.error(
          {
            code: error.code,
            meta,
            message: error.message,
            stack: error.stack,
          },
          'Database error detected',
        );
        return ErrorFactory.createAppInternalError({
          code: config.internalError.code,
          message: config.internalError.message,
        });
    }
  }
}
