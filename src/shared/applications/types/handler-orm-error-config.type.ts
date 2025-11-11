/**
 * Configuración unificada de código y mensaje para un tipo de error.
 *
 * @remarks
 * Combina el código de error GraphQL y el mensaje descriptivo en un solo objeto,
 * simplificando la configuración de errores personalizados por módulo.
 *
 * @public
 */
export type ErrorConfig = {
  /** Código único del error en formato SCREAMING_SNAKE_CASE */
  readonly code: string;
  /** Mensaje descriptivo del error orientado al usuario */
  readonly message: string;
};

/**
 * Configuración completa para personalizar errores de ORM por tipo.
 *
 * @remarks
 * Permite a cada módulo sobrescribir tanto el código como el mensaje
 * para categorías específicas de errores de base de datos (Prisma).
 * Todas las propiedades son opcionales; los valores no proporcionados
 * se toman de la configuración por defecto.
 *
 * Solo se manejan errores de negocio esperados (P2002, P2025).
 * Todos los demás errores técnicos retornan un error interno genérico.
 *
 * @example
 * ```typescript
 * const userOrmConfig: HandlerOrmErrorConfig = {
 *   uniqueConstraint: {
 *     code: 'USER_EMAIL_ALREADY_EXISTS',
 *     message: 'A user with this email already exists'
 *   },
 *   notFound: {
 *     code: 'USER_NOT_FOUND',
 *     message: 'User not found in the system'
 *   }
 * };
 * ```
 *
 * @public
 */
export type HandlerOrmErrorConfig = {
  /** Error de violación de constraint único (ej: email duplicado) - P2002 */
  readonly uniqueConstraint?: ErrorConfig;
  /** Error de registro no encontrado en base de datos - P2025 */
  readonly notFound?: ErrorConfig;
  /** Error genérico para todos los demás errores técnicos */
  readonly internalError?: ErrorConfig;
};

/**
 * Meta información del error de Prisma.
 *
 * @remarks
 * Contiene detalles adicionales sobre el error de base de datos extraídos
 * del objeto de error de Prisma. Esta información es útil para debugging
 * y para proporcionar contexto adicional en los logs.
 *
 * @public
 */
export type PrismaErrorMeta = {
  /** Campos que causaron el error (ej: ['email'] en constraint único) */
  readonly target?: string[];
  /** Nombre del modelo de Prisma afectado */
  readonly modelName?: string;
  /** Causa raíz del error si está disponible */
  readonly cause?: string;
  /** Nombre del campo que causó el error */
  readonly field_name?: string;
  /** Nombre del constraint violado */
  readonly constraint?: string;
  /** Nombre de la tabla afectada */
  readonly table?: string;
  /** Nombre de la columna afectada */
  readonly column?: string;
  /** Mensaje de error de la base de datos */
  readonly database_error?: string;
};

/**
 * @deprecated Use HandlerOrmErrorConfig instead
 * @internal
 */
export type HandlerOrmErrorMessagesType = {
  readonly uniqueConstraint: string;
  readonly notFound: string;
  readonly foreignKeyConstraint: string;
  readonly validation: string;
  readonly connection: string;
  readonly unknown: string;
};
