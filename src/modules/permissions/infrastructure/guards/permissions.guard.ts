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
 * - Si la operación es sobre recursos propios (:own vs :all)
 * - Lógica OR (al menos uno) o AND (todos) según configuración
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

    // Si no hay usuario autenticado, denegar acceso
    // (esto no debería ocurrir si GqlJwtAuthGuard está antes)
    if (!user) {
      this.logger.warn('No authenticated user found in context');
      throw new InsufficientPermissionsError(requiredPermissions);
    }

    // TODO: Obtener permisos del usuario (rol base + permisos adicionales)
    // Por ahora, usaremos un array vacío como placeholder
    const userPermissions: string[] = [];

    // Determinar si la operación es sobre recursos propios
    const args: Record<string, unknown> = ctx.getArgs();
    const isOwnResource = this.isOwnResource(user, args);

    this.logger.debug(
      {
        userId: user.id,
        requiredPermissions,
        requireAll,
        isOwnResource,
      },
      'Checking permissions',
    );

    // Verificar permisos usando la lógica apropiada
    const hasPermission = requireAll
      ? this.permissionMatcher.hasAllPermissions(
          userPermissions,
          requiredPermissions,
          isOwnResource,
        )
      : this.permissionMatcher.hasAnyPermission(
          userPermissions,
          requiredPermissions,
          isOwnResource,
        );

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

  /**
   * Determina si la operación es sobre un recurso propio del usuario.
   *
   * @param user - Usuario autenticado
   * @param args - Argumentos del resolver
   * @returns true si la operación es sobre recursos propios del usuario
   *
   * @remarks
   * Verifica si los argumentos contienen un userId, id, o filter.userId
   * que coincida con el ID del usuario autenticado.
   *
   * @private
   */
  private isOwnResource(user: UserEntity, args: Record<string, unknown>): boolean {
    // Verificar si hay un userId en los argumentos directos
    if (args.userId === user.id) {
      return true;
    }

    // Verificar si hay un id en los argumentos que coincida con el userId
    if (args.id === user.id) {
      return true;
    }

    // Verificar si hay un filter.userId
    if (args.filter && typeof args.filter === 'object') {
      const filter = args.filter as Record<string, unknown>;
      if (filter.userId === user.id || filter.id === user.id) {
        return true;
      }
    }

    // Verificar si hay un input.userId o input.id
    if (args.input && typeof args.input === 'object') {
      const input = args.input as Record<string, unknown>;
      if (input.userId === user.id || input.id === user.id) {
        return true;
      }
    }

    return false;
  }
}
