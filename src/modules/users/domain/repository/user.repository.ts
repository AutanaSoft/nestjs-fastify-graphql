import { DomainBaseError } from '@/shared/domain/errors';
import { UserEntity } from '../entities';
import { UserCreateType, UserUpdateType } from '../types/user';

/**
 * Contrato del repositorio para operaciones de persistencia del agregado User.
 *
 * Esta interfaz abstrae el acceso a datos del dominio User y debe ser implementada
 * por adaptadores de infraestructura (e.g., TypeORM) para mantener la capa de dominio
 * independiente del framework.
 *
 * @remarks
 * Las implementaciones deben mapear errores de infraestructura a errores de dominio/aplicación
 * cuando sea apropiado y no deben filtrar tipos específicos del ORM a la capa de dominio.
 *
 * Todos los métodos pueden retornar {@link DomainBaseError} para manejar fallos de persistencia
 * de manera consistente sin lanzar excepciones directamente.
 *
 * @public
 */
export abstract class UserRepository {
  /**
   * Persiste un nuevo User en el sistema.
   *
   * @param user - Datos inmutables requeridos para crear el usuario
   * @returns Promesa que resuelve a la {@link UserEntity} creada con identificadores generados,
   *          o {@link DomainBaseError} si la operación falla
   * @throws Las implementaciones pueden lanzar errores cuando se violan restricciones de persistencia
   *         (e.g., email único ya existe)
   */
  abstract create(user: UserCreateType): Promise<UserEntity | DomainBaseError>;

  /**
   * Aplica cambios parciales a un User existente.
   *
   * @param params - Datos requeridos para actualizar el usuario, incluyendo el identificador
   * @returns Promesa que resuelve a la {@link UserEntity} actualizada si la operación fue exitosa,
   *          o {@link DomainBaseError} si falla
   * @throws Las implementaciones pueden lanzar errores cuando se violan restricciones de persistencia
   *         (e.g., nuevo email ya está en uso)
   * @remarks
   * Se soportan actualizaciones parciales; solo los campos proporcionados serán modificados.
   * El identificador en `params` debe corresponder a un usuario existente.
   */
  abstract update(params: UserUpdateType): Promise<UserEntity | DomainBaseError>;

  /**
   * Recupera un User por su identificador único.
   *
   * @param id - Identificador único del usuario
   * @returns Promesa que resuelve a la {@link UserEntity} cuando se encuentra,
   *          `null` cuando no existe, o {@link DomainBaseError} si la consulta falla
   */
  abstract findById(id: string): Promise<UserEntity | null | DomainBaseError>;

  /**
   * Recupera un User por su dirección de correo electrónico.
   *
   * @param email - Dirección de correo electrónico del usuario
   * @returns Promesa que resuelve a la {@link UserEntity} cuando se encuentra,
   *          `null` cuando no existe, o {@link DomainBaseError} si la consulta falla
   */
  abstract findByEmail(email: string): Promise<UserEntity | null | DomainBaseError>;

  /**
   * Recupera todos los Users registrados en el sistema.
   *
   * @returns Promesa que resuelve a un array de {@link UserEntity},
   *          vacío cuando no existen usuarios, o {@link DomainBaseError} si la consulta falla
   * @remarks
   * Esta operación puede ser costosa en sistemas con muchos usuarios.
   * Considere implementar paginación en casos de uso específicos.
   */
  abstract findAll(): Promise<UserEntity[] | DomainBaseError>;
}

/**
 * Token de inyección de dependencias para el repositorio User.
 *
 * @remarks
 * Utilice este símbolo para inyectar implementaciones del {@link UserRepository}
 * en constructores de casos de uso o servicios de aplicación.
 */
export const USER_REPOSITORY = Symbol('UserRepository');
