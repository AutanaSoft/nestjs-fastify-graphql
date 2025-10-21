import { UserRole, UserStatus } from '../enums/user.enum';

export type UserCreateType = {
  email: string;
  userName: string;
  password: string;
  status?: UserStatus;
  role?: UserRole;
  emailVerified?: Date | null;
};

export type UserUpdateType = {
  id: string;
  data: Partial<UserCreateType>;
};
