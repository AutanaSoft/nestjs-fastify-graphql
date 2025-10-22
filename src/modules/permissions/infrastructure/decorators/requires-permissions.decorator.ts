import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadata para almacenar los permisos requeridos.
 * @internal
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Opciones para el decorador RequiresPermissions.
 */
export interface RequiresPermissionsOptions {
  /**
   * Array de permisos requeridos.
   * Si se especifican múltiples permisos, se aplica lógica OR (basta con tener uno).
   */
  permissions: string[];

  /**
   * Si es true, requiere TODOS los permisos (lógica AND).
   * Si es false o no se especifica, requiere AL MENOS UNO (lógica OR).
   * @default false
   */
  requireAll?: boolean;
}

/**
 * Decorador que marca un resolver o método como protegido por permisos.
 *
 * @param permissions - Array de nombres de permisos requeridos (ej: ['user:read:all'])
 * @param requireAll - Si es true, requiere TODOS los permisos; si es false, requiere AL MENOS UNO
 *
 * @remarks
 * Este decorador debe usarse junto con PermissionsGuard para verificar los permisos.
 * Los permisos se verifican usando lógica OR por defecto (basta con tener uno).
 * Use requireAll: true para requerir todos los permisos especificados (lógica AND).
 *
 * El guard automáticamente verifica si el usuario está accediendo a su propio recurso
 * y ajusta la verificación entre permisos :own y :all según corresponda.
 *
 * @example
 * ```typescript
 * // Requiere user:read:all o user:manage (lógica OR)
 * @RequiresPermissions(['user:read:all'])
 * @Query(() => [UserDto])
 * async findAllUsers() { ... }
 *
 * // Requiere user:update:all Y permission:assign (lógica AND)
 * @RequiresPermissions(['user:update:all', 'permission:assign'], true)
 * @Mutation(() => UserDto)
 * async updateUserAndPermissions() { ... }
 * ```
 *
 * @public
 */
export const RequiresPermissions = (
  permissions: string[],
  requireAll: boolean = false,
): MethodDecorator => {
  return SetMetadata(PERMISSIONS_KEY, {
    permissions,
    requireAll,
  } as RequiresPermissionsOptions);
};
