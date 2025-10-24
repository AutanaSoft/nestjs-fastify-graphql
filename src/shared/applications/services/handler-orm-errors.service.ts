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
   * @throws DomainBaseError Siempre lanza un error de dominio apropiado.
   */
  public handleError(
    error: unknown,
    errorsMessages: Partial<HandlerOrmErrorMessagesType> = {},
  ): DomainBaseError {
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
      throw this.extendWithOriginalError(
        ErrorFactory.createInternalServerError(
          'DATABASE_VALIDATION_ERROR',
          mergedMessages.validation,
        ),
        this.buildGraphQLErrorOptions(error),
      );
    }

    if (error instanceof PrismaClientInitializationError) {
      this.logger.debug('PrismaClientInitializationError detected');
      throw this.extendWithOriginalError(
        ErrorFactory.createInternalServerError(
          'DATABASE_CONNECTION_ERROR',
          mergedMessages.connection,
        ),
        this.buildGraphQLErrorOptions(error),
      );
    }

    if (error instanceof PrismaClientRustPanicError) {
      this.logger.error('PrismaClientRustPanicError detected');
      throw this.extendWithOriginalError(
        ErrorFactory.createInternalServerError('DATABASE_PANIC_ERROR', mergedMessages.unknown),
        this.buildGraphQLErrorOptions(error),
      );
    }

    if (error instanceof PrismaClientUnknownRequestError) {
      this.logger.debug('PrismaClientUnknownRequestError detected');
      throw this.extendWithOriginalError(
        ErrorFactory.createInternalServerError('DATABASE_UNKNOWN_ERROR', mergedMessages.unknown),
        this.buildGraphQLErrorOptions(error),
      );
    }

    return this.handleUnknownError(error, mergedMessages);
  }

  /**
   * Maneja errores no clasificados arrojando una excepción genérica.
   * @param error Error recibido desde el adaptador ORM.
   * @param errorsMessages Mensajes configurados para el error.
   * @returns Nunca retorna porque lanza una excepción.
   * @throws DomainBaseError Siempre, encapsulando el error original.
   */
  private handleUnknownError(
    error: unknown,
    errorsMessages: HandlerOrmErrorMessagesType,
  ): DomainBaseError {
    this.logger.assign({ method: 'handleUnknownError' });
    this.logger.error({ error }, 'Unknown Prisma error detected');
    return this.extendWithOriginalError(
      ErrorFactory.createInternalServerError('DATABASE_UNKNOWN_ERROR', errorsMessages.unknown),
      this.buildGraphQLErrorOptions(error),
    );
  }

  /**
   * Interpreta un PrismaClientKnownRequestError y lanza la excepción apropiada.
   * @param error Error conocido producido por Prisma durante la ejecución.
   * @param errorMessages Mensajes configurados para cada categoría.
   * @returns Nunca retorna porque lanza una excepción.
   * @throws DomainBaseError Siempre lanza un error de dominio apropiado según el código.
   */
  private handleKnownRequestError(
    error: PrismaClientKnownRequestError,
    errorMessages: HandlerOrmErrorMessagesType,
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
            'UNIQUE_CONSTRAINT_VIOLATION',
            errorMessages.uniqueConstraint,
            context,
          ),
          graphqlOptions,
        );
      case 'P2025': // Record not found
        return this.extendWithOriginalError(
          ErrorFactory.createNotFoundError('RECORD_NOT_FOUND', errorMessages.notFound, context),
          graphqlOptions,
        );
      case 'P2003': // Foreign key constraint violation
        return this.extendWithOriginalError(
          ErrorFactory.createInternalServerError(
            'FOREIGN_KEY_CONSTRAINT_VIOLATION',
            errorMessages.foreignKeyConstraint,
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
            'DATABASE_VALIDATION_ERROR',
            errorMessages.validation,
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
            'DATABASE_CONNECTION_ERROR',
            errorMessages.connection,
            context,
          ),
          graphqlOptions,
        );
      default:
        return this.extendWithOriginalError(
          ErrorFactory.createInternalServerError('DATABASE_ERROR', errorMessages.unknown, context),
          graphqlOptions,
        );
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

  /**
   * Extiende un error de dominio con el error original de Prisma.
   * @param domainError Error de dominio creado por el factory.
   * @param graphqlOptions Opciones de GraphQL con el error original.
   * @returns El error de dominio con el originalError incluido.
   *
   * @remarks
   * Este método es necesario porque ErrorFactory crea errores de dominio puros,
   * pero necesitamos agregar el originalError de Prisma para mantener el stack trace
   * completo en el contexto de GraphQL. Esto es especialmente útil para debugging.
   */
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
