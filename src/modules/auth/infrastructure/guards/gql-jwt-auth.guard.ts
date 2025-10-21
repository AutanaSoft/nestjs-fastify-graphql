import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación JWT para GraphQL.
 *
 * Este guard extiende el JwtAuthGuard para trabajar específicamente con contextos de GraphQL.
 * Adapta el contexto del request desde el contexto de ejecución de GraphQL para que funcione
 * con las estrategias de Passport.
 *
 * A diferencia del JwtAuthGuard estándar que funciona con requests HTTP,
 * este guard extrae el request desde el contexto de GraphQL apropiadamente.
 * @public
 */
@Injectable()
export class GqlJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Extrae el objeto request del contexto de ejecución de GraphQL.
   *
   * Este método sobrescribe el comportamiento por defecto para trabajar con contextos GraphQL.
   * Extrae el request HTTP desde el contexto de GraphQL para que Passport pueda
   * acceder a los headers, tokens de autenticación, etc.
   *
   * @param context - El contexto de ejecución (GraphQL en este caso).
   * @returns El objeto request HTTP.
   *
   * @public
   */
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return ctx.getContext().req;
  }
}
