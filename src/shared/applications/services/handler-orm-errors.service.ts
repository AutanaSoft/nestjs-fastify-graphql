import { ConflictError, DataBaseError, NotFoundError } from '@/shared/domain/errors';
import { Injectable } from '@nestjs/common';
import { GraphQLErrorOptions } from 'graphql';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { HANDLER_ORM_ERRORS_DEFAULT_MESSAGE } from '../constants';
import { HandlerOrmErrorMessagesType, PrismaErrorMeta } from '../types';

@Injectable()
/**
 * Gestiona los errores generados por Prisma ORM y los mapea a excepciones de dominio.
 * @public
 */
export class HandlerOrmErrorsService {
  constructor(
    @InjectPinoLogger(HandlerOrmErrorsService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Procesa un error de Prisma y lanza la excepción de dominio correspondiente.
   * @param error Error capturado en la capa de infraestructura.
   * @param errorsMessages Mensajes personalizados por tipo de error.
   * @returns Nunca retorna porque siempre lanza una excepción.
   * @throws NotFoundError Cuando el registro no existe (P2025).
   * @throws ConflictError Cuando ocurre una violación de unicidad (P2002).
   * @throws DataBaseError Cuando se detecta otro error de base de datos.
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
    this.logger.debug('Handling Prisma error...');

    if (error instanceof PrismaClientKnownRequestError) {
      this.logger.debug('PrismaClientKnownRequestError detected');
      return this.handleKnownRequestError(error, mergedMessages);
    }

    if (error instanceof PrismaClientValidationError) {
      this.logger.debug('PrismaClientValidationError detected');
      throw new DataBaseError(mergedMessages.validation, this.buildGraphQLErrorOptions(error));
    }

    if (error instanceof PrismaClientInitializationError) {
      this.logger.debug('PrismaClientInitializationError detected');
      throw new DataBaseError(mergedMessages.connection, this.buildGraphQLErrorOptions(error));
    }

    if (error instanceof PrismaClientRustPanicError) {
      this.logger.error('PrismaClientRustPanicError detected');
      throw new DataBaseError(mergedMessages.unknown, this.buildGraphQLErrorOptions(error));
    }

    if (error instanceof PrismaClientUnknownRequestError) {
      this.logger.debug('PrismaClientUnknownRequestError detected');
      throw new DataBaseError(mergedMessages.unknown, this.buildGraphQLErrorOptions(error));
    }

    return this.handleUnknownError(error, mergedMessages);
  }

  /**
   * Maneja errores no clasificados arrojando una excepción genérica.
   * @param error Error recibido desde el adaptador ORM.
   * @param errorsMessages Mensajes configurados para el error.
   * @returns Nunca retorna porque lanza una excepción.
   * @throws DataBaseError Siempre, encapsulando el error original.
   */
  private handleUnknownError(error: unknown, errorsMessages: HandlerOrmErrorMessagesType): never {
    this.logger.assign({ method: 'handleUnknownError' });
    this.logger.error({ error }, 'Unknown Prisma error detected');
    throw new DataBaseError(errorsMessages.unknown, this.buildGraphQLErrorOptions(error));
  }

  /**
   * Interpreta un PrismaClientKnownRequestError y lanza la excepción apropiada.
   * @param error Error conocido producido por Prisma durante la ejecución.
   * @param errorMessages Mensajes configurados para cada categoría.
   * @returns Nunca retorna porque lanza una excepción.
   * @throws NotFoundError Cuando el registro no existe (P2025).
   * @throws ConflictError Cuando se incumple una restricción de unicidad (P2002).
   * @throws DataBaseError Para otras violaciones o fallos de conexión.
   */
  private handleKnownRequestError(
    error: PrismaClientKnownRequestError,
    errorMessages: HandlerOrmErrorMessagesType,
  ): never {
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

    switch (error.code) {
      case 'P2002': // Unique constraint violation
        throw new ConflictError(
          errorMessages.uniqueConstraint,
          this.buildGraphQLErrorOptions(error),
        );
      case 'P2025': // Record not found
        throw new NotFoundError(errorMessages.notFound, this.buildGraphQLErrorOptions(error));
      case 'P2003': // Foreign key constraint violation
        throw new DataBaseError(
          errorMessages.foreignKeyConstraint,
          this.buildGraphQLErrorOptions(error),
        );
      case 'P2011': // Null constraint violation
      case 'P2012': // Missing required value
      case 'P2013': // Missing required argument
      case 'P2014': // Required relation violation
      case 'P2015': // Related record not found
      case 'P2019': // Input error
      case 'P2020': // Value out of range
        throw new DataBaseError(errorMessages.validation, this.buildGraphQLErrorOptions(error));
      case 'P1001': // Can't reach database server
      case 'P1002': // Database server timeout
      case 'P1008': // Operations timed out
      case 'P1017': // Server has closed the connection
        throw new DataBaseError(errorMessages.connection, this.buildGraphQLErrorOptions(error));
      default:
        throw new DataBaseError(errorMessages.unknown, this.buildGraphQLErrorOptions(error));
    }
  }

  /**
   * Construye opciones para ofrecer el error original en GraphQL.
   * @param error Error recibido desde Prisma.
   * @returns Opciones para GraphQLError o undefined.
   */
  private buildGraphQLErrorOptions(error: unknown): GraphQLErrorOptions | undefined {
    if (error instanceof Error) {
      return { originalError: error };
    }
    return undefined;
  }
}
