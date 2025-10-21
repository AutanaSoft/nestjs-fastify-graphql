import 'dotenv/config';
import path from 'path';
import { defineConfig } from 'prisma/config';

/**
 * Configuración de Prisma CLI.
 * Define rutas de schema, migraciones y seed.
 */
export default defineConfig({
  // Ruta al archivo de schema (por defecto)
  schema: path.join('prisma'),

  // Configuración de migraciones y seed
  migrations: {
    // Ruta donde se almacenan las migraciones
    path: 'prisma/migrations',

    // Comando para ejecutar el seed de la base de datos
    seed: 'npx tsx prisma/seeds/index.ts',
  },
});
