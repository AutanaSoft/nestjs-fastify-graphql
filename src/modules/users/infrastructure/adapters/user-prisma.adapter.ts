import { Injectable } from '@nestjs/common';
import { Prisma, User, UserPermission, Permission } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { HandlerOrmErrorsService, PrismaService } from '@/shared/applications/services';
import { CryptoService } from '@/shared/infrastructure/services';
import { UserEntity } from '../../domain/entities';
import { UserRepository } from '../../domain/repository';
import { UserCreateType, UserUpdateType, UserPermissionWithDetails } from '../../domain/types';

// Tipo para User con permisos anidados
type UserWithPermissions = User & {
  permissions: (UserPermission & {
    permission: Permission;
  })[];
};

@Injectable()
/**
 * Implementa el repositorio de usuarios utilizando Prisma ORM como adaptador.
 * @public
 * @see UserRepository
 */
export class UserPrismaAdapter implements UserRepository {
  constructor(
    @InjectPinoLogger(UserPrismaAdapter.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly handlerOrmErrorsService: HandlerOrmErrorsService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Crea un usuario persistiendo la entidad en la base de datos.
   * @param user Datos de creación del usuario.
   * @returns Promesa con la entidad almacenada.
   * @throws DataBaseError Cuando ocurre un fallo de persistencia.
   * @throws ConflictError Cuando ya existe un usuario con el mismo email o userName.
   */
  async create(user: UserCreateType): Promise<UserEntity> {
    try {
      this.logger.info(
        { createUser: { ...user, email: '***', password: '***' } },
        'Creating new user...',
      );

      // Cifrar email y generar hash para búsqueda
      const encryptedEmail = this.cryptoService.encrypt(user.email);
      const emailHash = this.cryptoService.hash(user.email);

      // Mapeo de datos para Prisma
      const createData: Prisma.UserCreateInput = {
        email: encryptedEmail,
        emailHash: emailHash,
        userName: user.userName,
        password: user.password,
      };

      // Mapeo de enums si están definidos
      if (user.status) createData.status = user.status;
      if (user.role) createData.role = user.role;

      // Persistencia con Prisma
      const created = await this.prisma.user.create({
        data: createData,
      });

      this.logger.info(
        { createdUser: { ...created, email: '***', password: '***' } },
        'User created successfully',
      );

      // Descifrar email antes de mapear a entidad de dominio
      return this.mapToDomainWithoutPermissions(created);
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, {
        uniqueConstraint: 'User with this email or userName already exists',
        foreignKeyConstraint: 'Invalid reference in user data',
        validation: 'Invalid user data provided',
        unknown: 'An unexpected error occurred while creating user',
      });
    }
  }

  /**
   * Actualiza los datos de un usuario existente identificado por su id.
   * @param params Parámetros de actualización con id y datos parciales.
   * @returns Indicador de actualización exitosa.
   * @throws DataBaseError Cuando ocurre un fallo de persistencia.
   * @throws ConflictError Cuando el email o userName ya están en uso.
   */
  async update(params: UserUpdateType): Promise<UserEntity> {
    try {
      this.logger.info({ updateUser: params.id }, 'Updating user...');
      const updateData: Prisma.UserUpdateInput = {};
      const { id, data: userData } = params;

      // Mapeo de datos a actualizar
      if (userData.email) {
        updateData.email = this.cryptoService.encrypt(userData.email);
        updateData.emailHash = this.cryptoService.hash(userData.email);
      }
      if (userData.userName) updateData.userName = userData.userName;
      if (userData.password) updateData.password = userData.password;
      if (userData.status) updateData.status = userData.status;
      if (userData.role) updateData.role = userData.role;

      // Actualización con Prisma
      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Mapeo a entidad de dominio
      this.logger.info(
        { updatedUser: { ...updated, email: '***', password: '***' } },
        'User updated successfully',
      );

      // Descifrar email antes de mapear a entidad de dominio
      return this.mapToDomainWithoutPermissions(updated);
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, {
        uniqueConstraint: 'User with this email or username already exists',
        notFound: 'User not found',
        foreignKeyConstraint: 'Invalid reference in user data',
        validation: 'Invalid user data provided',
        unknown: 'An unexpected error occurred while updating user',
      });
    }
  }

  /**
   * Recupera un usuario a partir de su identificador.
   * @param id Identificador del usuario.
   * @returns Promesa con la entidad encontrada o null.
   * @throws DataBaseError Cuando ocurre un fallo al consultar datos.
   */
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return user ? this.mapToDomain(user) : null;
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, {
        notFound: 'User with this ID not found',
        validation: 'Invalid user data provided',
        unknown: 'An unexpected error occurred while fetching user',
      });
    }
  }

  /**
   * Recupera un usuario a partir de su correo electrónico.
   * @param email Correo electrónico del usuario (en texto plano).
   * @returns Promesa con la entidad encontrada o null.
   * @throws DataBaseError Cuando ocurre un fallo al consultar datos.
   * @remarks La búsqueda se realiza mediante el hash del email (emailHash) para trabajar con emails cifrados.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      // Generar hash del email para búsqueda
      const emailHash = this.cryptoService.hash(email);

      const user = await this.prisma.user.findUnique({
        where: { emailHash },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return user ? this.mapToDomain(user) : null;
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, {
        notFound: 'User with this email not found',
        validation: 'Invalid user data provided',
        unknown: 'An unexpected error occurred while fetching user',
      });
    }
  }

  /**
   * Recupera todos los usuarios registrados en la base de datos.
   * @returns Promesa con el listado de usuarios.
   * @throws DataBaseError Cuando ocurre un fallo al consultar datos.
   */
  async findAll(): Promise<UserEntity[]> {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users.map((user) => this.mapToDomain(user));
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, {
        notFound: 'User with this criteria not found',
        validation: 'Invalid user data provided',
        unknown: 'An unexpected error occurred while fetching users',
      });
    }
  }

  /**
   * Mapea un registro de Prisma a una entidad de dominio descifrando el email.
   * @param user Registro de usuario de Prisma con permisos incluidos.
   * @returns Entidad de dominio con el email descifrado.
   * @private
   */
  private mapToDomain(user: UserWithPermissions): UserEntity {
    // Descifrar el email antes de mapear a la entidad de dominio
    const decryptedEmail = this.cryptoService.decrypt(user.email);

    // Mapear permisos anidados a la estructura que espera UserEntity
    const permissions: UserPermissionWithDetails[] = user.permissions.map((userPermission) => ({
      id: userPermission.id,
      userId: userPermission.userId,
      permissionId: userPermission.permissionId,
      grantedAt: userPermission.grantedAt,
      code: userPermission.permission.name, // Usar el name del Permission como code
      name: userPermission.permission.name,
      description: userPermission.permission.description,
    }));

    return UserEntity.toDomain({
      ...user,
      email: decryptedEmail,
      permissions,
    });
  }

  /**
   * Mapea un registro de Prisma sin permisos a una entidad de dominio con permisos vacíos.
   * @param user Registro de usuario de Prisma sin permisos.
   * @returns Entidad de dominio con el email descifrado y permisos vacíos.
   * @private
   */
  private mapToDomainWithoutPermissions(user: User): UserEntity {
    // Descifrar el email antes de mapear a la entidad de dominio
    const decryptedEmail = this.cryptoService.decrypt(user.email);

    return UserEntity.toDomain({
      ...user,
      email: decryptedEmail,
      permissions: [], // Array vacío para operaciones create/update
    });
  }
}
