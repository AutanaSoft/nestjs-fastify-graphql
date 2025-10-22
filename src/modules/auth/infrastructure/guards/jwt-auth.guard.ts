import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación basado en JWT (JSON Web Token).
 *
 * Protege rutas y resolvers GraphQL verificando la presencia y validez
 * de un token JWT en las peticiones. Delega la validación a la estrategia
 * Passport 'jwt' configurada en el módulo de autenticación.
 *
 * @public
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
