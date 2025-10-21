import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SignUpUseCase } from './application/use-cases';
import { AuthResolver } from './infrastructure/resolvers';

/**
 * Módulo de autenticación
 *
 * Proporciona funcionalidad de autenticación y autorización para la aplicación.
 * Incluye gestión de tokens JWT, validación de credenciales y control de acceso.
 *
 * @public
 */
@Module({
  imports: [UsersModule],
  providers: [AuthResolver, SignUpUseCase],
  exports: [],
})
export class AuthModule {}
