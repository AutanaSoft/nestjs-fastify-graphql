import { User } from '@prisma/client';
import { UserEntity } from '../../domain/entities';
import { UserRole, UserStatus } from '../../domain/enums/user.enum';

/**
 * Mapper para convertir entre modelos de Prisma y entidades de dominio de User.
 * @public
 * @remarks
 * Centraliza toda la lógica de transformación entre la capa de infraestructura (Prisma)
 * y la capa de dominio, manteniendo las capas desacopladas.
 */
export class UserMapper {
  /**
   * Convierte un modelo de Prisma User a una entidad de dominio UserEntity.
   * @param prismaUser Modelo de usuario proveniente de Prisma.
   * @returns Entidad de dominio UserEntity.
   * @remarks
   * Realiza el mapeo de tipos entre los enums de Prisma y los enums del dominio.
   */
  static toDomain(prismaUser: User): UserEntity {
    return UserEntity.fromPersistence({
      id: prismaUser.id,
      email: prismaUser.email,
      userName: prismaUser.userName,
      password: prismaUser.password,
      status: this.mapStatusToDomain(prismaUser.status),
      role: this.mapRoleToDomain(prismaUser.role),
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  /**
   * Convierte un array de modelos de Prisma User a un array de entidades de dominio.
   * @param prismaUsers Array de usuarios de Prisma.
   * @returns Array de entidades de dominio UserEntity.
   */
  static toDomainList(prismaUsers: User[]): UserEntity[] {
    return prismaUsers.map((user) => this.toDomain(user));
  }

  /**
   * Mapea un UserStatus de Prisma al enum del dominio.
   * @param status Estado de usuario en formato Prisma.
   * @returns Estado de usuario en formato de dominio.
   */
  private static mapStatusToDomain(status: User['status']): UserStatus {
    return status as unknown as UserStatus;
  }

  /**
   * Mapea un UserRole de Prisma al enum del dominio.
   * @param role Rol de usuario en formato Prisma.
   * @returns Rol de usuario en formato de dominio.
   */
  private static mapRoleToDomain(role: User['role']): UserRole {
    return role as unknown as UserRole;
  }
}
