import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
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
) {
  /**
   * Estado del usuario.
   *
   * @remarks
   * Debe ser uno de los valores del enum UserStatus.
   */
  @Field(() => UserStatus, { nullable: true, description: 'Status of the user' })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status must be a valid UserStatus value.' })
  status?: UserStatus;

  /**
   * Rol del usuario.
   *
   * @remarks
   * Debe ser uno de los valores del enum UserRole.
   */
  @Field(() => UserRole, { nullable: true, description: 'Role of the user' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid UserRole value.' })
  role?: UserRole;
}
