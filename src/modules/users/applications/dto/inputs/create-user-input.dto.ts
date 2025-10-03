import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { IsUserEmail, IsUserPassword } from '@/shared/applications/decorators';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType({ description: 'Input data for creating a new user' })
export class CreateUserInputDto {
  @Field(() => String, { description: 'UserName of the new user' })
  @IsString({ message: 'UserName must be a string' })
  @IsNotEmpty({ message: 'UserName should not be empty' })
  userName!: string;

  @Field(() => String, { description: 'Email address of the new user' })
  @IsUserEmail()
  email!: string;

  @Field(() => String, { description: 'Password for the new user' })
  @IsUserPassword()
  password!: string;

  @Field(() => UserStatus, {
    description: 'Status of the new user',
    nullable: true,
    defaultValue: UserStatus.REGISTERED,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status must be a valid UserStatus enum value' })
  status?: UserStatus;

  @Field(() => UserRole, {
    description: 'Role of the new user',
    nullable: true,
    defaultValue: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid UserRole enum value' })
  role?: UserRole;
}
