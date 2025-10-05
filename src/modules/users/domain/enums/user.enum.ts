import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}
registerEnumType(UserRole, { name: 'UserRole', description: 'Roles assigned to users' });

export enum UserStatus {
  REGISTERED = 'REGISTERED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}
registerEnumType(UserStatus, { name: 'UserStatus', description: 'Status of users in the system' });
