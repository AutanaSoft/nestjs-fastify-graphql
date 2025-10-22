import { Field, ObjectType } from '@nestjs/graphql';

/**
 * DTO de respuesta que representa un permiso del sistema.
 */
@ObjectType({ description: 'System permission' })
export class PermissionDto {
  @Field(() => String, { description: 'Permission unique identifier' })
  id: string;

  @Field(() => String, { description: 'Permission name in format resource:action:scope' })
  name: string;

  @Field(() => String, { description: 'Permission description', nullable: true })
  description: string | null;

  @Field(() => Date, { description: 'Permission creation date' })
  createdAt: Date;

  @Field(() => Date, { description: 'Permission last update date' })
  updatedAt: Date;
}

/**
 * DTO de respuesta que representa la asignación de un permiso a un usuario.
 */
@ObjectType({ description: 'User permission assignment' })
export class UserPermissionDto {
  @Field(() => String, { description: 'Assignment unique identifier' })
  id: string;

  @Field(() => String, { description: 'User identifier' })
  userId: string;

  @Field(() => String, { description: 'Permission identifier' })
  permissionId: string;

  @Field(() => Date, { description: 'Date when permission was granted' })
  grantedAt: Date;

  @Field(() => PermissionDto, { description: 'Permission details', nullable: true })
  permission?: PermissionDto;
}

/**
 * DTO de respuesta para la operación de asignación de permisos.
 */
@ObjectType({ description: 'Result of permission assignment operation' })
export class AssignPermissionsResponseDto {
  @Field(() => String, { description: 'User identifier' })
  userId: string;

  @Field(() => [String], { description: 'List of successfully assigned permission names' })
  assignedPermissions: string[];

  @Field(() => [String], {
    description: 'List of permission names that were already assigned',
  })
  alreadyAssigned: string[];

  @Field(() => Boolean, { description: 'Whether the operation was successful' })
  success: boolean;
}

/**
 * DTO de respuesta para la operación de revocación de permisos.
 */
@ObjectType({ description: 'Result of permission revocation operation' })
export class RevokePermissionsResponseDto {
  @Field(() => String, { description: 'User identifier' })
  userId: string;

  @Field(() => [String], { description: 'List of successfully revoked permission names' })
  revokedPermissions: string[];

  @Field(() => [String], { description: 'List of permission names that were not assigned' })
  notAssigned: string[];

  @Field(() => Boolean, { description: 'Whether the operation was successful' })
  success: boolean;
}
