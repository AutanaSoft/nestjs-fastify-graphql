import { Module } from '@nestjs/common';

import { SharedModule } from '@/shared/shared.module';
import { UsersModule } from '../users/users.module';
import { SignUpUseCase } from './application/use-cases';
import { GqlJwtAuthGuard, JwtAuthGuard } from './infrastructure/guards';
import { AuthResolver } from './infrastructure/resolvers';
import { JwtStrategy } from './infrastructure/strategies';

/**
 * Módulo de autenticación
 *
 * Proporciona funcionalidad de autenticación y autorización para la aplicación.
 * Incluye gestión de tokens JWT, validación de credenciales y control de acceso.
 *
 * Características:
 * - Autenticación JWT con Passport
 * - Guards para proteger rutas (HTTP y GraphQL)
 * - Estrategia JWT para validación automática de tokens
 * - Decorador @CurrentUser() para acceso al usuario autenticado
 * - Integración con el módulo de usuarios
 *
 * @public
 */
@Module({
  imports: [SharedModule, UsersModule],
  providers: [AuthResolver, SignUpUseCase, JwtStrategy, JwtAuthGuard, GqlJwtAuthGuard],
  exports: [JwtStrategy, JwtAuthGuard, GqlJwtAuthGuard],
})
export class AuthModule {}
