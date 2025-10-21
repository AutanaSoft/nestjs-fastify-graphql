import { PrismaClient } from '@prisma/client';
import {
  INITIAL_PERMISSIONS,
  validateRolePermissions,
  ROLE_PERMISSIONS,
} from '../data/permissions.data';

/**
 * Resultado del proceso de seeding de permisos.
 */
interface SeedPermissionsResult {
  created: number;
  updated: number;
  total: number;
}

/**
 * Seed de permisos del sistema.
 *
 * Crea o actualiza los permisos iniciales definidos en permissions.data.ts.
 * Usa transacciones para garantizar consistencia de datos y operaciones batch
 * para mejorar el rendimiento.
 *
 * @param prisma Cliente de Prisma para operaciones de base de datos.
 * @throws Error si hay inconsistencias en los datos o fallan las operaciones.
 *
 * @remarks
 * Este seed:
 * - Valida que ROLE_PERMISSIONS referencie solo permisos existentes
 * - Crea permisos nuevos en batch usando createMany
 * - Actualiza descripciones de permisos existentes en batch
 * - Usa transacciones para garantizar atomicidad
 * - Valida la integridad de los datos después de la operación
 */
export async function seedPermissions(prisma: PrismaClient): Promise<void> {
  console.log('🔐 Seeding permissions...');

  try {
    // Validar consistencia de ROLE_PERMISSIONS antes de proceder
    const validationErrors = validateRolePermissions(ROLE_PERMISSIONS);
    if (Object.keys(validationErrors).length > 0) {
      const errorDetails = Object.entries(validationErrors)
        .map(([role, missing]) => `  - ${role}: ${missing.join(', ')}`)
        .join('\n');
      throw new Error(
        `ROLE_PERMISSIONS references non-existent permissions:\n${errorDetails}\n` +
          'Please ensure all role permissions exist in INITIAL_PERMISSIONS.',
      );
    }

    // Ejecutar operaciones en una transacción para garantizar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Obtener permisos existentes
      const existingPermissions = await tx.permission.findMany({
        select: { name: true, description: true },
      });

      const existingPermissionsMap = new Map(
        existingPermissions.map((p) => [p.name, p.description]),
      );

      // Separar permisos a crear y actualizar
      const permissionsToCreate: Array<{ name: string; description: string }> = [];
      const permissionsToUpdate: Array<{ name: string; description: string }> = [];

      for (const permission of INITIAL_PERMISSIONS) {
        const existingDescription = existingPermissionsMap.get(permission.name);

        if (existingDescription === undefined) {
          // Permiso nuevo
          permissionsToCreate.push({
            name: permission.name,
            description: permission.description,
          });
        } else if (existingDescription !== permission.description) {
          // Permiso existente con descripción diferente
          permissionsToUpdate.push({
            name: permission.name,
            description: permission.description,
          });
        }
      }

      // Crear permisos nuevos en batch
      let createdCount = 0;
      if (permissionsToCreate.length > 0) {
        const createResult = await tx.permission.createMany({
          data: permissionsToCreate,
          skipDuplicates: true,
        });
        createdCount = createResult.count;
        console.log(`  ✅ Created ${createdCount} new permissions`);
      }

      // Actualizar permisos existentes en batch
      let updatedCount = 0;
      if (permissionsToUpdate.length > 0) {
        // Prisma no soporta updateMany con diferentes valores,
        // pero podemos usar Promise.all para ejecutarlas en paralelo
        await Promise.all(
          permissionsToUpdate.map((permission) =>
            tx.permission.update({
              where: { name: permission.name },
              data: { description: permission.description },
            }),
          ),
        );
        updatedCount = permissionsToUpdate.length;
        console.log(`  ✅ Updated ${updatedCount} permission descriptions`);
      }

      return {
        created: createdCount,
        updated: updatedCount,
        total: INITIAL_PERMISSIONS.length,
      } as SeedPermissionsResult;
    });

    // Validar integridad final: verificar que todos los permisos esperados existen
    const finalPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: [...INITIAL_PERMISSIONS.map((p) => p.name)],
        },
      },
      select: { name: true },
    });

    if (finalPermissions.length !== INITIAL_PERMISSIONS.length) {
      const foundNames = new Set(finalPermissions.map((p) => p.name));
      const missingPermissions = INITIAL_PERMISSIONS.filter((p) => !foundNames.has(p.name)).map(
        (p) => p.name,
      );

      throw new Error(
        `Data integrity validation failed: Expected ${INITIAL_PERMISSIONS.length} permissions, ` +
          `but found ${finalPermissions.length}. Missing: ${missingPermissions.join(', ')}`,
      );
    }

    // Resumen final
    if (result.created === 0 && result.updated === 0) {
      console.log('ℹ️  All permissions are up to date, no changes needed');
    } else {
      console.log(
        `✅ Permissions seeded successfully: ${result.created} created, ${result.updated} updated, ${result.total} total`,
      );
    }
  } catch (error) {
    // Propagar errores de validación sin envolver
    if (error instanceof Error && error.message.includes('ROLE_PERMISSIONS')) {
      throw error;
    }

    // Para otros errores, agregar contexto
    console.error('❌ Error seeding permissions:', error);
    throw new Error(
      `Failed to seed permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
