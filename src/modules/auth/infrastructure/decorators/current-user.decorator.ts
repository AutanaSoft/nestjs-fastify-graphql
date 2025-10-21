import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { UserEntity } from '@/modules/users/domain/entities';

/**
 * Decorador para extraer el usuario autenticado del request.
 *
 * Este decorador extrae el usuario que fue adjuntado al request por el JwtStrategy
 * durante el proceso de autenticación. Funciona tanto con requests HTTP como con
 * contextos de GraphQL.
 *
 * El decorador es agnóstico del contexto y funciona automáticamente con:
 * - Rutas HTTP protegidas con JwtAuthGuard
 * - Resolvers GraphQL protegidos con GqlJwtAuthGuard
 *
 * @example
 * Uso en controlador HTTP:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: UserEntity) {
 *   return {
 *     id: user.id,
 *     email: user.email,
 *     userName: user.userName,
 *   };
 * }
 * ```
 *
 * @example
 * Uso en resolver GraphQL:
 * ```typescript
 * @UseGuards(GqlJwtAuthGuard)
 * @Query(() => UserDto)
 * currentUser(@CurrentUser() user: UserEntity): UserDto {
 *   return new UserDto(user);
 * }
 * ```
 *
 * @public
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserEntity => {
    // Determinar si estamos en un contexto HTTP o GraphQL
    const contextType = context.getType();

    if (contextType === 'http') {
      // Contexto HTTP: extraer usuario directamente del request
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const request = context.switchToHttp().getRequest();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return request.user as UserEntity;
    }

    // Contexto GraphQL: extraer usuario del contexto GraphQL
    const ctx = GqlExecutionContext.create(context);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return ctx.getContext().req.user as UserEntity;
  },
);
