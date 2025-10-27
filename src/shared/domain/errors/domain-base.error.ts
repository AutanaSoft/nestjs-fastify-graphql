import { GraphQLError, GraphQLErrorOptions } from 'graphql';

/**
 * Clase base para todos los errores del dominio.
 *
 * Extiende GraphQLError para garantizar compatibilidad con el sistema GraphQL.
 * Todos los errores personalizados del dominio deben heredar de esta clase.
 *
 * @remarks
 * Restaura la cadena de prototipos para garantizar que instanceof funcione correctamente
 * con clases que hereden de esta.
 *
 * @public
 */
export class DomainBaseError extends GraphQLError {
  /**
   * @param message - Mensaje de error legible para humanos
   * @param options - Opciones adicionales de GraphQLError (extensions, nodes, etc.)
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error base para errores que se retornan al cliente.
 *
 * Utiliza esta clase para errores de validación, reglas de negocio
 * o cualquier error que deba ser mostrado al usuario final.
 *
 * @remarks
 * Estos errores no deben contener información sensible del sistema.
 *
 * @public
 */
export class ApiReturnError extends DomainBaseError {
  /**
   * @param message - Mensaje de error apropiado para mostrar al cliente
   * @param options - Opciones adicionales de GraphQLError
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error base para fallos de conexión o operaciones con bases de datos.
 *
 * Utiliza esta clase para errores relacionados con operaciones de persistencia,
 * consultas fallidas, conexiones perdidas o violaciones de restricciones.
 *
 * @remarks
 * Estos errores generalmente deben ser registrados y no expuestos directamente
 * al cliente en producción.
 *
 * @public
 */
export class DataBaseError extends DomainBaseError {
  /**
   * @param message - Descripción del error de base de datos
   * @param options - Opciones adicionales de GraphQLError
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error base para errores internos de la aplicación.
 *
 * Utiliza esta clase para errores inesperados del sistema que requieren
 * ser registrados y potencialmente enviados a un servicio de monitoreo.
 *
 * @remarks
 * Estos errores deben ser siempre registrados con nivel error e incluir
 * contexto completo para facilitar la depuración. No deben exponer
 * detalles internos al cliente.
 *
 * @public
 */
export class AppInternalError extends DomainBaseError {
  /**
   * @param message - Descripción técnica del error interno
   * @param options - Opciones adicionales de GraphQLError
   */
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
