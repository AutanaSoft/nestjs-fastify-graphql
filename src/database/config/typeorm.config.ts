import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Fuente de datos utilizada por la CLI de TypeORM para ejecutar migraciones.
 * @remarks
 * Replica la configuración de la aplicación con ajustes seguros: `synchronize` apagado y
 * logging condicionado por el entorno.
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'app_api_db',
  ssl: process.env.DB_SSL === 'true',
  synchronize: false, // Always false for migrations
  logging: process.env.DB_LOGGING === 'true' || !isProduction,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  migrationsRun: false,
});

export default AppDataSource;
