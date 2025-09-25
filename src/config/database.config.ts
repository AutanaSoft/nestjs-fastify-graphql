import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Define la configuración necesaria para establecer la conexión de TypeORM con PostgreSQL.
 * @public
 */
export interface DatabaseConfig {
  readonly type: 'postgres';
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly ssl: boolean;
  readonly synchronize: boolean;
  readonly logging: boolean;
  readonly autoLoadEntities: boolean;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

/**
 * Registra la configuración de base de datos bajo el espacio de nombres `database`.
 * @remarks
 * Lee las variables de entorno prefijadas con `DB_` y provee valores por defecto seguros para
 * entornos locales. En producción la sincronización se desactiva automáticamente.
 * @returns Configuración tipada de la base de datos para inyección en NestJS.
 */
export default registerAs('databaseConfig', (): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'app_api_db',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || !isProduction,
    logging: process.env.DB_LOGGING === 'true' || false,
    autoLoadEntities: true,
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),
  };
});

/**
 * Crea las opciones que consume `TypeOrmModule.forRoot()` a partir de la configuración tipada.
 * @param config Configuración de base de datos ya validada.
 * @returns Opciones listas para inicializar el módulo de TypeORM.
 */
export const createTypeOrmModuleOptions = (
  config: DatabaseConfig,
): TypeOrmModuleOptions => ({
  type: config.type,
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  ssl: config.ssl,
  synchronize: config.synchronize,
  logging: config.logging,
  autoLoadEntities: config.autoLoadEntities,
  retryAttempts: config.retryAttempts,
  retryDelay: config.retryDelay,
  entities: [], // Auto-loaded via autoLoadEntities
});
