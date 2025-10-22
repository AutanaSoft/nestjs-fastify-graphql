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

/**
 * Tipo extendido de UserPermission que incluye información del Permission.
 * Usado en el dominio para tener acceso completo a los datos del permiso.
 */
export type UserPermissionWithDetails = {
  id: string;
  userId: string;
  permissionId: string;
  grantedAt: Date;
  code: string;
  name: string;
  description?: string | null;
};
