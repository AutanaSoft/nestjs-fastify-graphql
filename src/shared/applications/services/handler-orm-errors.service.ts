import { ConflictError, DataBaseError, NotFoundError } from '@/shared/domain/errors';
import { Injectable } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { HANDLER_ORM_ERRORS_DEFAULT_MESSAGE } from '../constants';
import { HandlerOrmErrorMessagesType, QueryFailedDriverError } from '../types';

/**
 * Servicio encargado de transformar errores del ORM en errores de dominio.
 * @public
 */
@Injectable()
export class HandlerOrmErrorsService {
  constructor(
    @InjectPinoLogger(HandlerOrmErrorsService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Procesa un error arrojado por el ORM y lo mapea a una excepción de dominio.
   * @param error Error original generado por el ORM o la base de datos.
   * @param errorsMessages Mensajes personalizados para cada escenario de error.
   * @returns Nunca retorna porque siempre lanza una excepción de dominio.
   */
  public handleError(
    error: unknown,
    errorsMessages: Partial<HandlerOrmErrorMessagesType> = {},
  ): never {
    const mergedMessages: HandlerOrmErrorMessagesType = {
      ...HANDLER_ORM_ERRORS_DEFAULT_MESSAGE,
      ...errorsMessages,
    };

    this.logger.assign({ error });
    this.logger.debug('Handling ORM error...');

    if (error instanceof EntityNotFoundError) {
      this.logger.debug('EntityNotFoundError detected');
      throw new NotFoundError(mergedMessages.notFound, this.buildGraphQLErrorOptions(error));
    }

    // procesamos los errores de TypeORM conocidos
    if (error instanceof QueryFailedError) {
      this.logger.debug('QueryFailedError detected');
      return this.handleQueryFailedError(error as QueryFailedError<Error>, mergedMessages);
    }

    return this.handleUnknownError(error, mergedMessages);
  }

  private handleUnknownError(error: unknown, errorsMessages: HandlerOrmErrorMessagesType): never {
    this.logger.assign({ method: 'handleUnknownError' });
    this.logger.error('Processing unknown database error');
    throw new DataBaseError(errorsMessages.unknown, this.buildGraphQLErrorOptions(error));
  }

  private handleQueryFailedError(
    error: QueryFailedError<Error>,
    errorMessages: HandlerOrmErrorMessagesType,
  ): never {
    const driverError =
      (error as unknown as { driverError?: QueryFailedDriverError })?.driverError ?? {};
    this.logger.assign({
      method: 'handleQueryFailedError',
      driverError: {
        code: driverError.code,
        detail: driverError.detail,
        schema: driverError.schema,
        table: driverError.table,
        constraint: driverError.constraint,
      },
    });

    const code = driverError.code;
    switch (code) {
      case '23505': // unique_violation
        throw new ConflictError(
          errorMessages.uniqueConstraint,
          this.buildGraphQLErrorOptions(error),
        );
      case '23503': // foreign_key_violation
        throw new ConflictError(
          errorMessages.foreignKeyConstraint,
          this.buildGraphQLErrorOptions(error),
        );
      case '23502': // not_null_violation
      case '23514': // check_violation
      case '22P02': // invalid_text_representation
      case '22007': // invalid_datetime_format
      case '22001': // string_data_right_truncation
        throw new DataBaseError(errorMessages.validation, this.buildGraphQLErrorOptions(error));
      case '08006': // connection_failure
      case '08003': // connection_does_not_exist
        throw new DataBaseError(errorMessages.connection, this.buildGraphQLErrorOptions(error));
      default:
        throw new DataBaseError(errorMessages.unknown, this.buildGraphQLErrorOptions(error));
    }
  }

  private buildGraphQLErrorOptions(error: unknown): GraphQLErrorOptions | undefined {
    if (error instanceof Error) {
      return { originalError: error };
    }
    return undefined;
  }
}
