import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { HandlerOrmErrorsService, PrismaService } from '@/shared/applications/services';
import { UserEntity } from '../../domain/entities';
import { UserRole, UserStatus } from '../../domain/enums/user.enum';
import { UserRepository } from '../../domain/repository';
import { UserCreateType, UserUpdateType } from '../../domain/types';

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
      this.logger.info({ createUser: user }, 'Creating new user...');

      // Mapeo de datos para Prisma
      const createData: Prisma.UserCreateInput = {
        email: user.email,
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

      return this.mapToEntity(created);
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
      this.logger.info({ updateUser: params }, 'Updating user...');
      const updateData: Prisma.UserUpdateInput = {};
      const { id, data: userData } = params;

      // Mapeo de datos a actualizar
      if (userData.email) updateData.email = userData.email;
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
      return this.mapToEntity(updated);
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
      this.logger.info({ findUserById: id }, 'Finding user by ID...');
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      return user ? this.mapToEntity(user) : null;
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
   * @param email Correo electrónico del usuario.
   * @returns Promesa con la entidad encontrada o null.
   * @throws DataBaseError Cuando ocurre un fallo al consultar datos.
   * @remarks La búsqueda se realiza de forma case-insensitive usando el modo insensitive de Prisma.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      this.logger.info({ findUserByEmail: email }, 'Finding user by email...');
      const user = await this.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      });
      this.logger.info({ userFound: user }, 'User search completed');
      this.logger.info({ user: user ? this.mapToEntity(user) : null }, 'User details retrieved');
      return user ? this.mapToEntity(user) : null;
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
      this.logger.info('Finding all users...');
      const users = await this.prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return users.map((user) => this.mapToEntity(user));
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, {
        notFound: 'User with this criteria not found',
        validation: 'Invalid user data provided',
        unknown: 'An unexpected error occurred while fetching users',
      });
    }
  }

  /**
   * Mapea un modelo de Prisma a una entidad de dominio.
   * @param user Modelo de Prisma User.
   * @returns Entidad de dominio UserEntity.
   */
  private mapToEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.userName = user.userName;
    entity.password = user.password;
    entity.status = user.status as unknown as UserStatus;
    entity.role = user.role as unknown as UserRole;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }
}
