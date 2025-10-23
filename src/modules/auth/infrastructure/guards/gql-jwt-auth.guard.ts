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
 * El guard funciona en coordinación con:
 * - JwtStrategy: Valida el token y recupera el usuario
 * - JwtTokenService: Maneja la validación de estructura del token
 * - PermissionsGuard: Verifica permisos específicos del usuario
 *
 * @see {@link JwtStrategy} Para la lógica de validación del token
 * @see {@link PermissionsGuard} Para validación de permisos
 * @see {@link CurrentUser} Para decorador de usuario actual
 *
 * @public
 */
@Injectable()
export class GqlJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Extrae la petición HTTP del contexto de ejecución de GraphQL.
   *
   * Este método es requerido por AuthGuard para adaptar la extracción
   * de la petición HTTP desde el contexto específico de GraphQL.
   *
   * @param context - Contexto de ejecución de NestJS que contiene información
   *                  sobre la petición actual, incluyendo headers, body, etc.
   * @returns La petición HTTP del contexto de GraphQL que contiene los headers
   *          necesarios para extraer el token JWT del Authorization header
   *
   * @remarks
   * GraphQL ejecuta las peticiones en un contexto diferente al REST,
   * por lo que necesitamos extraer la petición HTTP subyacente para
   * que Passport pueda acceder a los headers HTTP y extraer el token JWT.
   *
   * El token se espera en el formato: `Authorization: Bearer <token>`
   *
   * @internal
   */
  getRequest(context: ExecutionContext): GraphQLContext['req'] {
    // Crear el contexto específico de GraphQL desde el contexto de ejecución de NestJS
    const ctx = GqlExecutionContext.create(context);

    // Extraer la petición HTTP desde el contexto de GraphQL
    // Esto permite a Passport acceder a los headers HTTP para el token JWT
    return ctx.getContext<GraphQLContext>().req;
  }
}
