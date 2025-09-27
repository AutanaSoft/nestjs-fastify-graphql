/**
 * Configuración para personalizar mensajes y códigos de errores de ORM.
 * @remarks Se usa para mapear errores de infraestructura a mensajes de Aplicación.
 */
export type HandlerOrmErrorMessagesType = {
  readonly uniqueConstraint: string;
  readonly notFound: string;
  readonly foreignKeyConstraint: string;
  readonly validation: string;
  readonly connection: string;
  readonly unknown: string;
};

/**
 * Códigos de error para personalizar el mapeo de errores de ORM.
 * @remarks Se usa para mapear errores de infraestructura a mensajes de Aplicación.
 */
export type HandlerOrmErrorCodeType = {
  readonly notFound?: string;
};

/**
 * Error del driver de la base de datos.
 * @remarks Se usa para extraer información adicional del error.
 */
export type QueryFailedDriverError = {
  readonly code?: string;
  readonly detail?: string;
  readonly schema?: string;
  readonly table?: string;
  readonly constraint?: string;
};
