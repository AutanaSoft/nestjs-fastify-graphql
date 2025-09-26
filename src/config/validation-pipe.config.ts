import { HttpStatus, ValidationPipeOptions } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { GraphQLError } from 'graphql';
import { mapHttpStatusToGraphqlCode } from '@/shared/infrastructure/utils/graphql-codes';

/**
 * Describe los errores agrupados por campo devueltos por el pipe de validación.
 * @public
 */
interface ValidationPipeErrorItem {
  readonly field: string;
  readonly messages: string[];
}

/**
 * Error GraphQL especializado para encapsular fallos de validación.
 * @public
 */
class ValidationPipeError extends GraphQLError {
  constructor(public readonly validationErrors: ValidationPipeErrorItem[]) {
    const message = validationErrors[0]?.messages[0] ?? 'Data validation failed';
    const code = mapHttpStatusToGraphqlCode(HttpStatus.BAD_REQUEST);

    super(message, {
      extensions: {
        code,
        status: HttpStatus.BAD_REQUEST,
        validationErrors,
      },
    });

    // Establece el prototipo explícitamente para conservar la cadena correcta
    Object.setPrototypeOf(this, ValidationPipeError.prototype);
  }
}

/**
 * Transforma un error de class-validator en la estructura utilizada por GraphQL.
 * @param error Error original emitido por class-validator.
 * @returns Lista de errores normalizados.
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
 * Configuración estándar para el `ValidationPipe` global de la aplicación.
 * @returns Opciones del `ValidationPipe` alineadas con GraphQL.
 */
export default registerAs(
  'validationPipeConfig',
  (): ValidationPipeOptions => ({
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
  }),
);
