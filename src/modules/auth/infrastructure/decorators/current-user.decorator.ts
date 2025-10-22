import { UserEntity } from '@/modules/users/domain/entities';
import { FastifyContext, GraphQLContext } from '@/shared/domain/types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserPermission } from '@prisma/client';

/**
 * Decorador de parámetro que extrae el usuario autenticado del contexto de la petición.
 *
 * @remarks
 * Este decorador es compatible con contextos HTTP (Fastify) y GraphQL (Apollo Server).
 * Extrae automáticamente la entidad del usuario autenticado según el tipo de contexto.
 *
 * Para contextos HTTP, obtiene el usuario del objeto `request` de Fastify.
 * Para contextos GraphQL, obtiene el usuario del contexto de GraphQL (`req.user`).
 *
 * @public
 *
 * @returns La entidad del usuario autenticado
 *
 * @throws Si el usuario no está presente en el contexto, retorna `undefined`
 *
 * @see UserEntity
 * @see FastifyContext
 * @see GraphQLContext
 */
export const CurrentUser = createParamDecorator(
  (
    data: unknown,
    context: ExecutionContext,
  ): UserEntity & {
    permissions?: UserPermission[];
  } => {
    // Determinar si estamos en un contexto HTTP o GraphQL
    const contextType = context.getType();

    if (contextType === 'http') {
      // Contexto HTTP: extraer usuario directamente del request
      const request = context.switchToHttp().getRequest<FastifyContext['request']>();
      return request.user as UserEntity & {
        permissions?: UserPermission[];
      };
    }

    // Contexto GraphQL: extraer usuario del contexto GraphQL
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<GraphQLContext>().req.user as UserEntity & {
      permissions?: UserPermission[];
    };
  },
);
