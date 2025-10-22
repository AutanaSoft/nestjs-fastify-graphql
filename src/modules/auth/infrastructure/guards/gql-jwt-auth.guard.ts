import { GraphQLContext } from '@/shared/domain/types';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación JWT para resolvers de GraphQL.
 *
 * Extiende el AuthGuard de Passport con estrategia 'jwt' y adapta
 * la extracción de la petición desde el contexto de GraphQL.
 *
 * @remarks
 * Este guard se utiliza para proteger resolvers que requieren autenticación.
 * Extrae y valida el token JWT desde los headers de la petición HTTP
 * subyacente en el contexto de GraphQL.
 *
 * @public
 */
@Injectable()
export class GqlJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Extrae la petición HTTP del contexto de ejecución de GraphQL.
   *
   * @param context - Contexto de ejecución de NestJS
   * @returns La petición HTTP del contexto de GraphQL
   */
  getRequest(context: ExecutionContext): GraphQLContext['req'] {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<GraphQLContext>().req;
  }
}
