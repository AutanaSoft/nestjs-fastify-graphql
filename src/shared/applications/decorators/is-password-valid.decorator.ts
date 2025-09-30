import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * @public
 * @remarks
 * Define las opciones disponibles para personalizar el decorador `IsUserPassword`.
 * @property fieldLabel Etiqueta utilizada en los mensajes de validación. Por defecto es "Password".
 * @property minLength Longitud mínima aceptada para la contraseña. Por defecto es 8.
 * @property maxLength Longitud máxima aceptada para la contraseña. Por defecto es 16.
 */
export type IsUserPasswordOptions = {
  readonly fieldLabel?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
};

/**
 * @public
 * @remarks
 * Aplica reglas de complejidad sobre contraseñas de usuarios, incluyendo longitud y presencia de caracteres clave.
 * @param options Permite personalizar los mensajes y los umbrales de longitud.
 * @returns Conjunto de decoradores que normaliza y valida el valor recibido como contraseña.
 */
export function IsUserPassword(options: IsUserPasswordOptions = {}): PropertyDecorator {
  const { fieldLabel = 'Password', minLength = 8, maxLength = 16 } = options;
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
  return applyDecorators(
    IsNotEmpty({ message: `${fieldLabel} must not be empty.` }),
    IsString({ message: `${fieldLabel} must be a string.` }),
    MinLength(minLength, {
      message: `${fieldLabel} must contain at least ${minLength} characters.`,
    }),
    MaxLength(maxLength, {
      message: `${fieldLabel} must contain at most ${maxLength} characters.`,
    }),
    Matches(pattern, {
      message: `${fieldLabel} must include uppercase, lowercase, numeric and special characters (@$!%*?&).`,
    }),
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
  );
}
