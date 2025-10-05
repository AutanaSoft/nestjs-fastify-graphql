import { UserRole, UserStatus } from '../enums/user.enum';

/**
 * Datos necesarios para reconstruir una entidad User desde persistencia.
 */
export type UserEntityData = {
  readonly id: string;
  readonly email: string;
  readonly userName: string;
  readonly password: string;
  readonly status: UserStatus;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

/**
 * Entidad de dominio que representa un usuario del sistema.
 * @public
 */
export class UserEntity {
  readonly id: string;
  readonly email: string;
  readonly userName: string;
  readonly password: string;
  readonly status: UserStatus;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(data: UserEntityData) {
    this.id = data.id;
    this.email = data.email;
    this.userName = data.userName;
    this.password = data.password;
    this.status = data.status;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Crea una instancia de UserEntity a partir de datos de persistencia.
   * @param data Datos del usuario provenientes de la base de datos.
   * @returns Nueva instancia de UserEntity.
   * @remarks Este método es usado por los adaptadores de infraestructura para reconstruir entidades.
   */
  static fromPersistence(data: UserEntityData): UserEntity {
    return new UserEntity(data);
  }
}
