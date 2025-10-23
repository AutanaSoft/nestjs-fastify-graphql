import { UserEntity } from '@/modules/users/domain/entities';
import { GraphQLContext } from '@/shared/domain/types';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { InsufficientPermissionsError } from '../../domain/errors';
import { PermissionMatcherService } from '../../domain/services';
import { PERMISSIONS_KEY, RequiresPermissionsOptions } from '../decorators';

/**
 * Guard que verifica si el usuario tiene los permisos requeridos para acceder a un resolver.
 *
 * @remarks
 * Este guard debe usarse después de GqlJwtAuthGuard para asegurar que el usuario esté autenticado.
 * Lee los permisos requeridos del decorador @RequiresPermissions y verifica si el usuario
 * tiene los permisos necesarios, considerando:
 * - Permisos del rol base del usuario
 * - Permisos adicionales asignados explícitamente
 * - Lógica OR (al menos uno) o AND (todos) según configuración
 *
 * La validación de propiedad de recursos se delega a los casos de uso.
 *
 * @public
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(PermissionsGuard.name)
    private readonly logger: PinoLogger,
    private readonly reflector: Reflector,
    private readonly permissionMatcher: PermissionMatcherService,
  ) {}

  /**
   * Verifica si el usuario puede activar la ruta/resolver.
   *
   * @param context - Contexto de ejecución de NestJS
   * @returns true si el usuario tiene permisos suficientes; de lo contrario lanza InsufficientPermissionsError
   * @throws InsufficientPermissionsError cuando el usuario no tiene los permisos requeridos
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtener metadata de permisos requeridos
    const permissionsOptions = this.reflector.getAllAndOverride<RequiresPermissionsOptions>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay permisos requeridos, permitir acceso
    if (!permissionsOptions) {
      return true;
    }

    const { permissions: requiredPermissions, requireAll = false } = permissionsOptions;

    // Extraer usuario del contexto GraphQL
    const ctx = GqlExecutionContext.create(context);
    const graphqlContext = ctx.getContext<GraphQLContext>();
    const user = graphqlContext.req.user as UserEntity;

    // Obtener permisos del usuario desde la entidad (ya es string[] optimizado para JWT)
    const userPermissions: string[] = user.permissions;

    this.logger.debug(
      {
        userId: user.id,
        requiredPermissions,
        requireAll,
        userPermissions,
      },
      'Checking permissions',
    );

    // Verificar permisos usando la lógica apropiada
    const hasPermission = requireAll
      ? this.permissionMatcher.hasAllPermissions(userPermissions, requiredPermissions)
      : this.permissionMatcher.hasAnyPermission(userPermissions, requiredPermissions);

    if (!hasPermission) {
      this.logger.warn(
        {
          userId: user.id,
          requiredPermissions,
          userPermissions,
        },
        'Insufficient permissions',
      );
      throw new InsufficientPermissionsError(requiredPermissions);
    }

    return true;
  }
}
