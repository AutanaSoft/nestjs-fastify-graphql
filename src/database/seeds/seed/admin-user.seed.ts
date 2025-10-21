import { PrismaClient } from '@prisma/client';
import { getAdminUserData, getAdminCredentialsWarning } from '../data/admin-user.data';
import { ROLE_PERMISSIONS } from '../data/permissions.data';
import { HashUtils } from '@/shared/applications/utils';

/**
 * Seed del usuario administrador inicial.
 * Crea el usuario admin con todos los permisos del rol ADMIN.
 * Usa transacciones para garantizar consistencia de datos.
 *
 * @param prisma Cliente de Prisma para operaciones de base de datos.
 * @throws Error si faltan permisos críticos o hay problemas de seguridad.
 */
export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  console.log('👤 Seeding admin user...');

  try {
    // Obtener datos del administrador (valida credenciales en producción)
    const adminData = getAdminUserData();

    // Verificar si ya existe el usuario admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists, skipping creation');
      return;
    }

    // Validar que todos los permisos necesarios existan antes de crear el usuario
    const adminPermissionNames = ROLE_PERMISSIONS.ADMIN;
    const permissions = await prisma.permission.findMany({
      where: {
        name: {
          in: [...adminPermissionNames], // Convertir readonly array a mutable array
        },
      },
    });

    // Abortar si faltan permisos críticos
    if (permissions.length !== adminPermissionNames.length) {
      const foundPermissions = permissions.map((p) => p.name);
      const missingPermissions = adminPermissionNames.filter(
        (name) => !foundPermissions.includes(name),
      );
      throw new Error(
        `Cannot create admin user: Critical permissions are missing: ${missingPermissions.join(', ')}. ` +
          'Please ensure permissions are seeded before creating the admin user.',
      );
    }

    // Hashear la contraseña
    const hashedPassword = await HashUtils.hashPassword(adminData.password);

    // Crear el usuario y asignar permisos en una transacción
    // Esto garantiza que ambas operaciones se completen o ninguna
    await prisma.$transaction(async (tx) => {
      // Crear el usuario administrador
      const adminUser = await tx.user.create({
        data: {
          email: adminData.email,
          userName: adminData.userName,
          password: hashedPassword,
          role: adminData.role,
          status: adminData.status,
          emailVerified: adminData.emailVerified,
        },
      });

      console.log(`✅ Admin user created: ${adminUser.email} (ID: ${adminUser.id})`);

      // Preparar datos de permisos
      const userPermissions = permissions.map((permission) => ({
        userId: adminUser.id,
        permissionId: permission.id,
      }));

      // Asignar todos los permisos al usuario administrador
      await tx.userPermission.createMany({
        data: userPermissions,
        skipDuplicates: true,
      });

      console.log(`✅ Assigned ${permissions.length} permissions to admin user`);
    });

    // Mostrar advertencia sobre las credenciales
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(getAdminCredentialsWarning(adminData.email, adminData.userName, !isProduction));
  } catch (error) {
    // Si el error es de seguridad o validación, propagarlo sin envolver
    if (error instanceof Error && error.message.includes('SECURITY ERROR')) {
      throw error;
    }

    // Para otros errores, agregar contexto
    console.error('❌ Error seeding admin user:', error);
    throw new Error(
      `Failed to seed admin user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
