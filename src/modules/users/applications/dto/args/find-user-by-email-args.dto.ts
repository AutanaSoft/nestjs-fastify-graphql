import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO de argumentos para buscar un usuario por su dirección de correo electrónico.
 *
 * @public
 */
@ArgsType()
export class FindUserByEmailArgsDto {
  @Field(() => String, { description: 'User email address' })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsString({ message: 'Email must be a string' })
  email!: string;
}
