import { CurrentUser } from '@/modules/auth/infrastructure/decorators';
import { GqlJwtAuthGuard } from '@/modules/auth/infrastructure/guards';
import { UserEntity } from '@/modules/users/domain/entities';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { plainToInstance } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import {
  AssignPermissionsArgsDto,
  AssignPermissionsResponseDto,
  FindAllPermissionsArgsDto,
  FindUserPermissionsArgsDto,
  PermissionDto,
  RevokePermissionsArgsDto,
  RevokePermissionsResponseDto,
} from '../../application/dto';
import {
  AssignPermissionsUseCase,
  FindAllPermissionsUseCase,
  FindUserPermissionsUseCase,
  RevokePermissionsUseCase,
} from '../../application/use-cases';
import { RequiresPermissions } from '../decorators';
import { PermissionsGuard } from '../guards';

/**
 * Resolver GraphQL para operaciones de permisos.
 *
 * @remarks
 * Proporciona queries y mutations para gestionar permisos del sistema:
 * - Consultar todos los permisos disponibles
 * - Consultar permisos de un usuario específico
 * - Asignar permisos adicionales a usuarios
 * - Revocar permisos de usuarios
 *
 * Todas las operaciones requieren autenticación (GqlJwtAuthGuard)
 * y verificación de permisos específicos (PermissionsGuard).
 *
 * @public
 */
@Resolver()
@UseGuards(GqlJwtAuthGuard, PermissionsGuard)
export class PermissionsResolver {
  constructor(
    private readonly findAllPermissionsUseCase: FindAllPermissionsUseCase,
    private readonly findUserPermissionsUseCase: FindUserPermissionsUseCase,
    private readonly assignPermissionsUseCase: AssignPermissionsUseCase,
    private readonly revokePermissionsUseCase: RevokePermissionsUseCase,
    @InjectPinoLogger(PermissionsResolver.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Query para obtener todos los permisos del sistema.
   *
   * @param args - Argumentos con filtros opcionales
   * @param currentUser - Usuario autenticado actual
   * @returns Lista de permisos del sistema
   *
   * @remarks
   * Requiere permiso: permission:read
   */
  @Query(() => [PermissionDto], {
    name: 'permissions',
    description: 'Get all system permissions with optional search filter',
  })
  @RequiresPermissions(['permission:read'])
  async permissions(
    @Args() args: FindAllPermissionsArgsDto,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<PermissionDto[]> {
    this.logger.assign({ resolver: 'permissions', userId: currentUser.id });
    this.logger.info({ filter: args.filter }, 'Finding all permissions');

    const permissions = await this.findAllPermissionsUseCase.execute(args);

    this.logger.info({ count: permissions.length }, 'Permissions retrieved successfully');
    return plainToInstance(PermissionDto, permissions);
  }

  /**
   * Query para obtener los permisos asignados a un usuario específico.
   *
   * @param args - Argumentos con filtro de userId
   * @param currentUser - Usuario autenticado actual
   * @returns Lista de permisos del usuario
   *
   * @remarks
   * Requiere permiso: permission:read (para ver permisos de otros usuarios)
   * Los usuarios pueden ver sus propios permisos sin este permiso.
   */
  @Query(() => [PermissionDto], {
    name: 'userPermissions',
    description: 'Get permissions assigned to a specific user',
  })
  @RequiresPermissions(['permission:read'])
  async userPermissions(
    @Args() args: FindUserPermissionsArgsDto,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<PermissionDto[]> {
    this.logger.assign({ resolver: 'userPermissions', userId: currentUser.id });
    this.logger.info({ targetUserId: args.filter.userId }, 'Finding user permissions');

    const permissions = await this.findUserPermissionsUseCase.execute(args);

    this.logger.info(
      { targetUserId: args.filter.userId, count: permissions.length },
      'User permissions retrieved successfully',
    );
    return plainToInstance(PermissionDto, permissions);
  }

  /**
   * Mutation para asignar permisos adicionales a un usuario.
   *
   * @param args - Argumentos con userId y lista de permissionNames
   * @param currentUser - Usuario autenticado actual
   * @returns Resultado de la asignación
   *
   * @remarks
   * Requiere permiso: permission:assign o permission:manage
   */
  @Mutation(() => AssignPermissionsResponseDto, {
    name: 'assignPermissions',
    description: 'Assign additional permissions to a user',
  })
  @RequiresPermissions(['permission:assign', 'permission:manage'])
  async assignPermissions(
    @Args() args: AssignPermissionsArgsDto,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<AssignPermissionsResponseDto> {
    this.logger.assign({ resolver: 'assignPermissions', userId: currentUser.id });
    this.logger.info(
      { targetUserId: args.input.userId, permissions: args.input.permissionNames },
      'Assigning permissions',
    );

    const result = await this.assignPermissionsUseCase.execute(args);

    this.logger.info(
      {
        targetUserId: result.userId,
        assigned: result.assignedPermissions.length,
        alreadyAssigned: result.alreadyAssigned.length,
      },
      'Permissions assigned successfully',
    );

    return {
      ...result,
      success: true,
    };
  }

  /**
   * Mutation para revocar permisos de un usuario.
   *
   * @param args - Argumentos con userId y lista de permissionNames
   * @param currentUser - Usuario autenticado actual
   * @returns Resultado de la revocación
   *
   * @remarks
   * Requiere permiso: permission:revoke o permission:manage
   */
  @Mutation(() => RevokePermissionsResponseDto, {
    name: 'revokePermissions',
    description: 'Revoke permissions from a user',
  })
  @RequiresPermissions(['permission:revoke', 'permission:manage'])
  async revokePermissions(
    @Args() args: RevokePermissionsArgsDto,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<RevokePermissionsResponseDto> {
    this.logger.assign({ resolver: 'revokePermissions', userId: currentUser.id });
    this.logger.info(
      { targetUserId: args.input.userId, permissions: args.input.permissionNames },
      'Revoking permissions',
    );

    const result = await this.revokePermissionsUseCase.execute(args);

    this.logger.info(
      {
        targetUserId: result.userId,
        revoked: result.revokedPermissions.length,
        notAssigned: result.notAssigned.length,
      },
      'Permissions revoked successfully',
    );

    return {
      ...result,
      success: true,
    };
  }
}
