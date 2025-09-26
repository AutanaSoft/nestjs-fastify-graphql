import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'User entity representation' })
export class UserEntityDto {
  @Field(() => ID, { description: 'Unique identifier for the user' })
  id: string;

  @Field(() => String, { description: 'Email address of the user' })
  email: string;

  @Field(() => String, { description: 'Username of the user' })
  userName: string;

  @Field(() => UserStatus, { description: 'Status of the user' })
  status: UserStatus;

  @Field(() => UserRole, { description: 'Role of the user' })
  role: UserRole;

  @Field(() => Date, { description: 'Date when the user was created' })
  createdAt: Date;

  @Field(() => Date, { description: 'Date when the user was last updated' })
  updatedAt: Date;
}
