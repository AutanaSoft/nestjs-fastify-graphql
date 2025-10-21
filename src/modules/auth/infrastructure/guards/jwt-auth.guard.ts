import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación JWT para rutas HTTP.
 *
 * Este guard extiende el AuthGuard de Passport para proporcionar autenticación basada en JWT.
 * Valida automáticamente los tokens JWT y adjunta la información del usuario al request.
 *
 * Uso:
 * - Aplicar a controllers o rutas que requieran autenticación
 * - Puede usarse globalmente o en endpoints específicos
 * - Funciona con rutas REST y GraphQL (cuando se configura apropiadamente)
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Query(() => User)
 * async getCurrentUser(@CurrentUser() user: UserEntity) {
 *   return user;
 * }
 * ```
 *
 * @public
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
