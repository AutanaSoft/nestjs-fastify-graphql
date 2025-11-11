/**
 * Catálogo de eventos del dominio.
 *
 * @remarks
 * Nomenclatura: {MÓDULO}.{ENTIDAD}.{ACCIÓN}
 * Usa puntos como delimitador para facilitar wildcards y filtrado.
 *
 * @public
 */
export enum DomainEvents {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGGED_IN = 'user.logged.in',
  USER_LOGGED_OUT = 'user.logged.out',
  USER_PASSWORD_CHANGED = 'user.password.changed',

  // Permission events
  PERMISSION_ASSIGNED = 'permission.assigned',
  PERMISSION_REVOKED = 'permission.revoked',
  PERMISSION_UPDATED = 'permission.updated',

  // Auth events
  AUTH_TOKEN_GENERATED = 'auth.token.generated',
  AUTH_TOKEN_REFRESHED = 'auth.token.refreshed',
  AUTH_TOKEN_REVOKED = 'auth.token.revoked',
  AUTH_PASSWORD_RESET_REQUESTED = 'auth.password.reset.requested',
  AUTH_PASSWORD_RESET_COMPLETED = 'auth.password.reset.completed',
}
