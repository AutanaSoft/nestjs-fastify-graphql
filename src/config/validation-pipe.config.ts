import { HttpStatus, ValidationPipeOptions } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { GraphQLError } from 'graphql';

/**
 * Representa un elemento de error de validación con el campo afectado y sus mensajes.
 */
interface ValidationPipeErrorItem {
  readonly field: string;
  readonly messages: string[];
}

/**
 * Error personalizado para validaciones de GraphQL que extiende GraphQLError.
 * Contiene información detallada sobre los errores de validación encontrados.
 *
 * @throws {ValidationPipeError} Se lanza cuando la validación de datos falla
 */
class ValidationPipeError extends GraphQLError {
  constructor(public readonly validationErrors: ValidationPipeErrorItem[]) {
    const message = validationErrors[0]?.messages[0] ?? 'Data validation failed';

    super(message, {
      extensions: {
        code: 'BAD_REQUEST',
        status: HttpStatus.BAD_REQUEST,
        validationErrors,
      },
    });

    Object.setPrototypeOf(this, ValidationPipeError.prototype);
  }
}

/**
 * Formatea recursivamente los errores de validación de class-validator.
 * Procesa tanto restricciones directas como errores anidados en objetos hijos.
 *
 * @param error - Error de validación de class-validator
 * @returns Array de elementos de error formateados con campo y mensajes
 */
const formatValidationError = (error: ClassValidatorError): ValidationPipeErrorItem[] => {
  const errors: ValidationPipeErrorItem[] = [];

  if (error.constraints) {
    errors.push({
      field: error.property,
      messages: Object.values(error.constraints),
    });
  }

  if (error.children?.length) {
    error.children.forEach((child) => {
      const childErrors = formatValidationError(child);
      errors.push(
        ...childErrors.map((childError) => ({
          field: `${error.property}.${childError.field}`,
          messages: childError.messages,
        })),
      );
    });
  }

  return errors;
};

/**
 * Genera la configuración del ValidationPipe para NestJS.
 * Habilita transformación automática, whitelist y validación estricta de datos.
 *
 * @returns Opciones de configuración para el ValidationPipe
 */
export const validationPipeConfigFactory = (): ValidationPipeOptions => ({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
  stopAtFirstError: false,
  transformOptions: {
    enableImplicitConversion: true,
  },
  validationError: {
    target: false,
    value: false,
  },
  exceptionFactory: (validationErrors: ClassValidatorError[]) => {
    const formattedErrors = validationErrors.flatMap(formatValidationError);
    return new ValidationPipeError(formattedErrors);
  },
});

/**
 * Configuración del ValidationPipe registrada con el namespace 'validationPipeConfig'.
 * Utiliza la factory para generar las opciones de validación centralizadas.
 */
export default registerAs(
  'validationPipeConfig',
  (): ValidationPipeOptions => validationPipeConfigFactory(),
);
