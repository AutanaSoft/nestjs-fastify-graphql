import { Field, InputType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO de entrada para asignar permisos a un usuario.
 */
@InputType({ description: 'Input data for assigning permissions to a user' })
export class AssignPermissionsInputDto {
  @Field(() => String, { description: 'User identifier', nullable: false })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @Field(() => [String], {
    description: 'List of permission names to assign',
    nullable: false,
  })
  @IsArray({ message: 'Permission names must be an array' })
  @ArrayMinSize(1, { message: 'At least one permission name is required' })
  @IsString({ each: true, message: 'Each permission name must be a string' })
  @IsNotEmpty({ each: true, message: 'Permission names cannot be empty' })
  permissionNames!: string[];
}

/**
 * DTO de entrada para revocar permisos de un usuario.
 */
@InputType({ description: 'Input data for revoking permissions from a user' })
export class RevokePermissionsInputDto {
  @Field(() => String, { description: 'User identifier', nullable: false })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @Field(() => [String], {
    description: 'List of permission names to revoke',
    nullable: false,
  })
  @IsArray({ message: 'Permission names must be an array' })
  @ArrayMinSize(1, { message: 'At least one permission name is required' })
  @IsString({ each: true, message: 'Each permission name must be a string' })
  @IsNotEmpty({ each: true, message: 'Permission names cannot be empty' })
  permissionNames!: string[];
}

/**
 * DTO de filtro para buscar permisos de un usuario.
 */
@InputType({ description: 'Filter criteria for finding user permissions' })
export class FindUserPermissionsFilterDto {
  @Field(() => String, { description: 'User identifier', nullable: false })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;
}

/**
 * DTO de filtro para buscar permisos del sistema.
 */
@InputType({ description: 'Filter criteria for finding permissions' })
export class FindPermissionsFilterDto {
  @Field(() => String, {
    description: 'Search term for permission name or description',
    nullable: true,
  })
  @IsString({ message: 'Search must be a string' })
  @IsOptional()
  search?: string;
}
