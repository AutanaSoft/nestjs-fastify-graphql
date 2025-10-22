import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import {
  AssignPermissionsInputDto,
  FindPermissionsFilterDto,
  FindUserPermissionsFilterDto,
  RevokePermissionsInputDto,
} from './permission-inputs.dto';

/**
 * Args DTO para asignar permisos a un usuario.
 */
@ArgsType()
export class AssignPermissionsArgsDto {
  @Field(() => AssignPermissionsInputDto, {
    description: 'Input data for assigning permissions',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => AssignPermissionsInputDto)
  input!: AssignPermissionsInputDto;
}

/**
 * Args DTO para revocar permisos de un usuario.
 */
@ArgsType()
export class RevokePermissionsArgsDto {
  @Field(() => RevokePermissionsInputDto, {
    description: 'Input data for revoking permissions',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => RevokePermissionsInputDto)
  input!: RevokePermissionsInputDto;
}

/**
 * Args DTO para buscar permisos de un usuario.
 */
@ArgsType()
export class FindUserPermissionsArgsDto {
  @Field(() => FindUserPermissionsFilterDto, {
    description: 'Filter criteria for finding user permissions',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => FindUserPermissionsFilterDto)
  filter!: FindUserPermissionsFilterDto;
}

/**
 * Args DTO para buscar todos los permisos del sistema.
 */
@ArgsType()
export class FindAllPermissionsArgsDto {
  @Field(() => FindPermissionsFilterDto, {
    description: 'Filter criteria for finding permissions',
    nullable: true,
  })
  @ValidateNested()
  @Type(() => FindPermissionsFilterDto)
  @IsOptional()
  filter?: FindPermissionsFilterDto;
}
