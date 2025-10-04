import { UserRole, UserStatus } from '../enums/user.enum';

export class UserEntity {
  id: string;
  email: string;
  userName: string;
  password: string;
  status: UserStatus;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
