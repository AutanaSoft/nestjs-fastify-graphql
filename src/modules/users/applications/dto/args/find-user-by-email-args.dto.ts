import { ArgsType, Field } from '@nestjs/graphql';
import { IsUserEmail } from '@/shared/applications/decorators';

/**
 * DTO de argumentos para buscar un usuario por su dirección de correo electrónico.
 *
 * @public
 */
@ArgsType()
export class FindUserByEmailArgsDto {
  @Field(() => String, { description: 'User email address' })
  @IsUserEmail()
  email!: string;
}
