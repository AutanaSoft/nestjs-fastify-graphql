import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO de argumentos para buscar un usuario por su dirección de correo electrónico.
 *
 * @public
 */
@ArgsType()
export class FindUserByEmailArgsDto {
  @Field(() => String, { description: 'User email address' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}
