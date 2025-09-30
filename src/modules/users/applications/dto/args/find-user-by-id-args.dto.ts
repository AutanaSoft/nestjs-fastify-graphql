import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO de argumentos para buscar un usuario por su identificador.
 *
 * @public
 */
@ArgsType()
export class FindUserByIdArgsDto {
  @Field(() => ID, { description: 'User unique identifier' })
  @IsUUID('4', { message: 'ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'ID is required' })
  id!: string;
}
