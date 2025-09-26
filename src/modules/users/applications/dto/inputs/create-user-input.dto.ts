import { Field, InputType } from '@nestjs/graphql';
import { IsUserEmail, IsUserName, IsUserPassword } from '@/shared/applications/decorators';

@InputType({ description: 'Input data for creating a new user' })
export class CreateUserInputDto {
  @Field(() => String, { description: 'UserName of the new user' })
  @IsUserName()
  userName: string;

  @Field(() => String, { description: 'Email address of the new user' })
  @IsUserEmail()
  email: string;

  @Field(() => String, { description: 'Password for the new user' })
  @IsUserPassword()
  password: string;
}
