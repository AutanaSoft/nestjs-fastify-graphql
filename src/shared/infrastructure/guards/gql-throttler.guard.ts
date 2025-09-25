import { GraphQLContext } from '@/config';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Guardia que aplica el límite de peticiones sobre las operaciones GraphQL.
 * @public
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  /**
   * Obtiene el contexto HTTP necesario para aplicar el límite de peticiones.
   * @param context Contexto de ejecución proporcionado por NestJS.
   * @returns Contexto GraphQL con los objetos de solicitud y respuesta.
   */
  getRequestResponse(
    context: ExecutionContext,
  ): GraphQLContext | ReturnType<ThrottlerGuard['getRequestResponse']> {
    const contextType = context.getType<GqlContextType>();
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<GraphQLContext>();
      const httpContext = context.switchToHttp();
      const req = ctx.req ?? httpContext.getRequest();
      const res = ctx.res ?? httpContext.getResponse();
      return { req, res } as GraphQLContext;
    }
    return super.getRequestResponse(context);
  }
}
