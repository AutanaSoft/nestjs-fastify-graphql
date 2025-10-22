import { Module } from '@nestjs/common';

import { SharedModule } from '@/shared/shared.module';
import { UsersModule } from '../users/users.module';
import {
  RefreshAccessTokenUseCase,
  RevokeRefreshTokenUseCase,
  SignUpUseCase,
} from './application/use-cases';
import { SESSION_REPOSITORY } from './domain/repositories';
import { RefreshTokenService } from './domain/services';
import { SessionPrismaAdapter } from './infrastructure/adapters';
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
 * - Sistema de refresh tokens con rotación automática
 * - Detección de reuso de tokens comprometidos
 * - Gestión de sesiones con metadata de auditoría
 *
 * @public
 */
@Module({
  imports: [SharedModule, UsersModule],
  providers: [
    // Resolvers
    AuthResolver,
    // Use Cases
    SignUpUseCase,
    RefreshAccessTokenUseCase,
    RevokeRefreshTokenUseCase,
    // Domain Services
    RefreshTokenService,
    // Repository Adapters
    {
      provide: SESSION_REPOSITORY,
      useClass: SessionPrismaAdapter,
    },
    // Auth Infrastructure
    JwtStrategy,
    JwtAuthGuard,
    GqlJwtAuthGuard,
  ],
  exports: [JwtStrategy, JwtAuthGuard, GqlJwtAuthGuard],
})
export class AuthModule {}
