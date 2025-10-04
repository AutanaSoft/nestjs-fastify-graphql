import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { UpdateUserInputDto } from '../inputs/update-user-input.dto';

/**
 * DTO de argumentos para la actualización de un usuario en GraphQL.
 *
 * Contiene el ID del usuario a actualizar y los datos de entrada validados.
 *
 * @public
 */
@ArgsType()
export class UpdateUserArgsDto {
  /**
   * Identificador único del usuario que se va a actualizar.
   *
   * @remarks
   * Debe ser un UUID válido en formato v4.
   */
  @Field(() => ID, { description: 'ID of the user to be updated' })
  @IsNotEmpty({ message: 'The user ID must not be empty.' })
  @IsUUID('all', { message: 'The user ID must be a valid ID.' })
  id!: string;

  /**
   * Datos de entrada para actualizar el usuario.
   *
   * @remarks
   * Contiene los campos modificables del usuario con sus respectivas validaciones.
   */
  @Field(() => UpdateUserInputDto, { description: 'Data for updating the user' })
  @ValidateNested()
  @Type(() => UpdateUserInputDto)
  data!: UpdateUserInputDto;
}
