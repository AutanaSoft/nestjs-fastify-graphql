import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * @public
 * @remarks
 * Define las opciones disponibles para personalizar los mensajes del decorador `IsUserName`.
 * @property fieldLabel Etiqueta que se incluirá en los mensajes de error. Por defecto es "Username".
 */
export type IsUserNameOptions = {
  readonly fieldLabel?: string;
};

/**
 * @public
 * @remarks
 * Aplica un conjunto de validaciones estandarizadas para asegurar un formato coherente de nombres de usuario.
 * @param options Permite personalizar la etiqueta usada en los mensajes de error.
 * @returns Decoradores que validan y transforman el valor recibido antes de su uso.
 */
export function IsUserName(options: IsUserNameOptions = {}): PropertyDecorator {
  const { fieldLabel = 'Username' } = options;
  return applyDecorators(
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
    IsNotEmpty({ message: `${fieldLabel} must not be empty.` }),
    IsString({ message: `${fieldLabel} must be a string.` }),
    MaxLength(20, { message: `${fieldLabel} must contain at most 20 characters.` }),
    MinLength(4, { message: `${fieldLabel} must contain at least 4 characters.` }),
    Matches(/^[A-Za-z].*$/, { message: `${fieldLabel} must start with a letter (A-Z or a-z).` }),
    Matches(/^[A-Za-z0-9._-]+$/, {
      message: `${fieldLabel} can include only letters, numbers, dots (.), underscores (_) or hyphens (-).`,
    }),
  );
}
