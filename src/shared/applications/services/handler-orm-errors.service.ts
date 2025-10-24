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
/**
 * Gestiona los errores generados por Prisma ORM y los mapea a excepciones de dominio.
 *
 * @remarks
 * Este servicio centraliza el manejo de errores de Prisma permitiendo que cada módulo
 * personalice los códigos y mensajes de error según su contexto. Usa el patrón de
 * configuración por defecto con sobrescritura opcional.
 *
 * @example
 * ```typescript
 * // En un repositorio
 * try {
 *   return await prisma.user.create({ data });
 * } catch (error) {
 *   return this.handlerOrmErrors.handleError(error, {
 *     uniqueConstraint: {
 *       code: 'USER_EMAIL_EXISTS',
 *       message: 'A user with this email already exists'
 *     }
 *   });
 * }
 * ```
 *
 * @public
 */
export class HandlerOrmErrorsService {
  constructor(
    @InjectPinoLogger(HandlerOrmErrorsService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Procesa un error de Prisma y retorna la excepción de dominio correspondiente.
   *
   * @param error Error capturado en la capa de infraestructura.
   * @param customConfig Configuración personalizada de códigos y mensajes por módulo.
   * @returns Instancia de DomainBaseError con el código y mensaje apropiados.
   *
   * @remarks
   * El servicio hace merge de la configuración personalizada con los defaults,
   * permitiendo sobrescribir solo los errores que el módulo necesita personalizar.
   */
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

  /**
   * Combina la configuración personalizada con los valores por defecto.
   *
   * @param customConfig Configuración personalizada proporcionada por el módulo.
   * @returns Configuración completa con todos los campos requeridos.
   *
   * @remarks
   * Usa el patrón de spread para combinar la configuración.
   * Si una categoría no se proporciona en customConfig, se usa el default completo.
   * Si se proporciona, reemplaza completamente la categoría del default (code y message).
   * El tipo ErrorConfig garantiza que cada categoría definida tenga ambas propiedades.
   *
   * @private
   */
  private mergeConfig(customConfig: HandlerOrmErrorConfig): Required<HandlerOrmErrorConfig> {
    return {
      ...HANDLER_ORM_ERRORS_DEFAULT_CONFIG,
      ...customConfig,
    } as Required<HandlerOrmErrorConfig>;
  }

  /**
   * Maneja errores no clasificados retornando una excepción genérica.
   *
   * @param error Error recibido desde el adaptador ORM.
   * @param config Configuración completa de errores.
   * @returns Instancia de DomainBaseError genérica.
   *
   * @private
   */
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

  /**
   * Interpreta un PrismaClientKnownRequestError y retorna la excepción apropiada.
   *
   * @param error Error conocido producido por Prisma durante la ejecución.
   * @param config Configuración completa de códigos y mensajes.
   * @returns Instancia de DomainBaseError apropiada según el código de Prisma.
   *
   * @remarks
   * Mapea códigos de error de Prisma a categorías de error de dominio:
   * - P2002: Violación de constraint único → CONFLICT (409)
   * - P2025: Registro no encontrado → NOT_FOUND (404)
   * - P2003: Violación de clave foránea → INTERNAL_SERVER_ERROR (500)
   * - P2011-P2020: Errores de validación → INTERNAL_SERVER_ERROR (500)
   * - P1001-P1017: Errores de conexión → INTERNAL_SERVER_ERROR (500)
   *
   * @private
   */
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
