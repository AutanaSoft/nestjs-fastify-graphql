/**
 * Configuración para personalizar mensajes y códigos de errores de ORM.
 * @remarks Se usa para mapear errores de infraestructura a mensajes de Aplicación.
 */
export type HandlerOrmErrorConfigType = {
  readonly messages?: {
    readonly uniqueConstraint?: string;
    readonly notFound?: string;
    readonly foreignKeyConstraint?: string;
    readonly validation?: string;
    readonly connection?: string;
    readonly unknown?: string;
  };
  readonly codes?: {
    readonly notFound?: string;
  };
};
