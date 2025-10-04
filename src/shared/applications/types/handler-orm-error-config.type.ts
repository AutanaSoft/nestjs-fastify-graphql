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
 * Meta información del error de Prisma.
 * @remarks Contiene detalles adicionales sobre el error de base de datos.
 */
export type PrismaErrorMeta = {
  readonly target?: string[];
  readonly modelName?: string;
  readonly cause?: string;
  readonly field_name?: string;
  readonly constraint?: string;
  readonly table?: string;
  readonly column?: string;
  readonly database_error?: string;
};
