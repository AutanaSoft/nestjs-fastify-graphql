import { UserEntity } from '../entities';
import { UserCreateType, UserUpdateType } from '../types/user';

/**
 * Repository port for User aggregate persistence operations.
 *
 * This contract abstracts data access for the User domain and must be implemented
 * by infrastructure adapters (e.g., TypeORM) to keep the domain layer framework-agnostic.
 *
 * @remarks
 * Implementations should map infrastructure errors to domain/application errors where appropriate
 * and must not leak ORM-specific types into the domain layer.
 * @public
 */
export abstract class UserRepository {
  /**
   * Persists a new User.
   *
   * @param user - Immutable data required to create the user
   * @returns A promise that resolves to the created {@link UserEntity}, including generated identifiers
   * @throws Error Implementations may throw when persistence constraints are violated (e.g., unique email)
   */
  abstract create(user: UserCreateType): Promise<UserEntity>;

  /**
   * Applies partial changes to an existing User.
   *
   * @param params - Data required to update the user
   * @returns A promise that resolves to `true` if the update was successful; otherwise `false`
   * @throws Error Implementations may throw when persistence constraints are violated (e.g., unique email)
   * @remarks Partial updates are supported; only provided fields will be updated
   */
  abstract update(params: UserUpdateType): Promise<UserEntity>;

  /**
   * Retrieves a User by its identifier.
   *
   * @param id - User identifier
   * @returns A promise that resolves to the {@link UserEntity} when found; otherwise `null`
   */
  abstract findById(id: string): Promise<UserEntity | null>;

  /**
   * Retrieves a User by email address.
   *
   * @param email - User email address
   * @returns A promise that resolves to the {@link UserEntity} when found; otherwise `null`
   */
  abstract findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Returns all Users.
   *
   * @returns A promise that resolves to an array of {@link UserEntity}; empty when none exist
   */
  abstract findAll(): Promise<UserEntity[]>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
