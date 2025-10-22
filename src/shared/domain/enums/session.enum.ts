/**
 * Tipos de sesión para control de acceso.
 *
 * Define los diferentes tipos de dispositivos o plataformas desde
 * donde un usuario puede autenticarse.
 *
 * @public
 */
export enum SessionType {
  /** Sesión desde navegador web */
  WEB = 'WEB',
  /** Sesión desde aplicación móvil */
  MOBILE = 'MOBILE',
  /** Sesión desde cliente API o servicio */
  API = 'API',
}
