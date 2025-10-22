import { SharedModule } from '@/shared/shared.module';
import { Module } from '@nestjs/common';

import {
  AssignPermissionsUseCase,
  FindAllPermissionsUseCase,
  FindUserPermissionsUseCase,
  RevokePermissionsUseCase,
} from './application/use-cases';
import { PERMISSION_REPOSITORY } from './domain/repositories';
import { PermissionMatcherService } from './domain/services';
import { PermissionPrismaAdapter } from './infrastructure/adapters';
import { PermissionsGuard } from './infrastructure/guards';

/**
 * Módulo de permisos del sistema.
 *
 * @remarks
 * Este módulo proporciona:
 * - Gestión de permisos del sistema
 * - Verificación de permisos para control de acceso
 * - Asignación y revocación de permisos a usuarios
 * - Guard para proteger resolvers con permisos específicos
 *
 * @public
 */
@Module({
  imports: [SharedModule],
  exports: [PERMISSION_REPOSITORY, PermissionMatcherService, PermissionsGuard],
  providers: [
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PermissionPrismaAdapter,
    },
    PermissionMatcherService,
    PermissionsGuard,
    // Use cases
    AssignPermissionsUseCase,
    RevokePermissionsUseCase,
    FindAllPermissionsUseCase,
    FindUserPermissionsUseCase,
  ],
})
export class PermissionsModule {}
