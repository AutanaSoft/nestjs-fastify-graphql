import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * @public
 * @remarks
 * Define las opciones configurables para personalizar los mensajes y las reglas del decorador `IsUserEmail`.
 * @property fieldLabel Etiqueta que se mostrará en los mensajes de validación. Por defecto es "Email".
 * @property maxLength Cantidad máxima de caracteres permitidos. Por defecto es 64.
 */
export type IsUserEmailOptions = {
  readonly fieldLabel?: string;
  readonly maxLength?: number;
};

/**
 * @public
 * @remarks
 * Aplica validaciones estandarizadas sobre direcciones de correo electrónico.
 * @param options Permite ajustar la etiqueta de los mensajes y el límite de caracteres.
 * @returns Decoradores que normalizan y validan el valor recibido como correo electrónico.
 */
export function IsUserEmail(options: IsUserEmailOptions = {}): PropertyDecorator {
  const { fieldLabel = 'Email', maxLength = 64 } = options;
  return applyDecorators(
    Transform(({ value }: { value: string }) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    ),
    IsNotEmpty({ message: `${fieldLabel} must not be empty.` }),
    IsString({ message: `${fieldLabel} must be a string.` }),
    MaxLength(maxLength, {
      message: `${fieldLabel} must contain at most ${maxLength} characters.`,
    }),
    IsEmail({}, { message: `${fieldLabel} must be a valid email address.` }),
  );
}
