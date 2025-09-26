import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}
registerEnumType(UserRole, { name: 'UserRole', description: 'Roles assigned to users' });

export enum UserStatus {
  REGISTERED = 'registered',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}
registerEnumType(UserStatus, { name: 'UserStatus', description: 'Status of users in the system' });
