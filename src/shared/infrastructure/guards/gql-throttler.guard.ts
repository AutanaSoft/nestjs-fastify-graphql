import { GraphQLContext } from '@/config';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
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
  getRequestResponse(context: ExecutionContext): GraphQLContext {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext<GraphQLContext>();
    return { req: ctx.req, res: ctx.res };
  }
}
