import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType({ description: 'Input data for creating a new user' })
export class CreateUserInputDto {
  @Field(() => String, { description: 'UserName of the new user' })
  @IsNotEmpty({ message: 'UserName should not be empty' })
  @IsString({ message: 'UserName must be a string' })
  userName!: string;

  @Field(() => String, { description: 'Email address of the new user' })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsString({ message: 'Email must be a string' })
  email!: string;

  @Field(() => String, { description: 'Password for the new user' })
  @IsNotEmpty({ message: 'Password should not be empty' })
  @IsString({ message: 'Password must be a string' })
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
