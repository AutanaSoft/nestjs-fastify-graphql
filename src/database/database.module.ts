import { createTypeOrmModuleOptions, databaseConfig } from '@/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Módulo responsable de inicializar TypeORM con la configuración cargada desde ConfigModule.
 * @remarks
 * Registra la configuración `database` y expone `TypeOrmModule` para uso en otros módulos.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [databaseConfig.KEY],
      useFactory: createTypeOrmModuleOptions,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
