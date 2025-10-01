import { InputType, OmitType, PartialType } from '@nestjs/graphql';
import { CreateUserInputDto } from './create-user-input.dto';

/**
 * DTO de entrada para la actualización de un usuario en GraphQL.
 *
 * Extiende de CreateUserInputDto omitiendo los campos inmutables (email, password)
 * y convirtiendo todos los campos restantes en opcionales para permitir
 * actualizaciones parciales.
 *
 * @remarks
 * - El email y la contraseña no pueden modificarse mediante esta operación
 * - Todos los campos heredados son opcionales, permitiendo actualizaciones parciales
 * - Las validaciones de cada campo se heredan de CreateUserInputDto
 * - Se agregan campos adicionales para status y role
 *
 * @public
 */
@InputType()
export class UpdateUserInputDto extends PartialType(
  OmitType(CreateUserInputDto, ['email', 'password'] as const),
) {}
