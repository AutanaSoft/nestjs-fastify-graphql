import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seed/permissions.seed';
import { seedAdminUser } from './seed/admin-user.seed';

const prisma = new PrismaClient();

/**
 * Función principal de seeding.
 * Ejecuta todos los seeds en el orden correcto.
 */
async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed de permisos (debe ejecutarse primero)
    await seedPermissions(prisma);

    console.log(''); // Línea en blanco para separar logs

    // 2. Seed de usuario administrador (requiere permisos)
    await seedAdminUser(prisma);

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during database seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
