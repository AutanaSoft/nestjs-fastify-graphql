/**
 * Estructura de un permiso del sistema.
 *
 * @remarks
 * Los permisos siguen el sistema de 2 niveles:
 * - `resource:action` - Permiso básico (implica recursos propios)
 * - `resource:action:all` - Permiso administrativo (todos los recursos)
 * - `resource:manage` - Gestión completa del recurso
 *
 * @public
 */
export interface Permission {
  /** Nombre del permiso en formato resource:action[:scope] */
  name: string;
  /** Descripción legible del permiso */
  description: string;
}
