import { UserEntity } from '@/modules/users/domain/entities';
import { FastifyContext, GraphQLContext } from '@/shared/domain/types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Decorador de parámetro que extrae el usuario autenticado del contexto de
 * la petición actual.
 *
 * Este decorador es compatible tanto con contextos HTTP (Fastify) como con
 * contextos GraphQL. Detecta automáticamente el tipo de contexto y extrae
 * el usuario de la ubicación apropiada.
 *
 * @remarks
 * El usuario debe ser inyectado previamente en el request por un guard de
 * autenticación (por ejemplo, JwtAuthGuard) antes de usar este decorador.
 *
 * @returns La entidad del usuario autenticado
 *
 * @public
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserEntity => {
    // Determinar si estamos en un contexto HTTP o GraphQL
    const contextType = context.getType();

    if (contextType === 'http') {
      // Contexto HTTP: extraer usuario directamente del request
      const request = context.switchToHttp().getRequest<FastifyContext['request']>();
      return request.user as UserEntity;
    }

    // Contexto GraphQL: extraer usuario del contexto GraphQL
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<GraphQLContext>().req.user as UserEntity;
  },
);
