import 'dotenv/config';
import path from 'path';
import { defineConfig } from 'prisma/config';

const _baseDir = path.join('src', 'database');
/**
 * Configuración de Prisma CLI.
 * Define rutas de schema, migraciones y seed.
 */
export default defineConfig({
  // Ruta al archivo de schema (por defecto)
  schema: _baseDir,

  // Configuración de migraciones y seed
  migrations: {
    // Ruta donde se almacenan las migraciones
    path: path.join(_baseDir, 'migrations'),

    // Comando para ejecutar el seed de la base de datos
    seed: `npx tsx ${path.join(_baseDir, 'seeds/index.ts')}`,
  },
});
