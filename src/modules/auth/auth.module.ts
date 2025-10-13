import { Module } from '@nestjs/common';
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
  imports: [],
  providers: [AuthResolver],
  exports: [],
})
export class AuthModule {}
