import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { HandlerOrmErrorsService } from '@/shared/applications/services/handler-orm-errors.service';
import { UserEntity } from '../../domain/entities';
import { UserRepository } from '../../domain/repository';
import { UserCreateType, UserUpdateType } from '../../domain/types';

@Injectable()
/**
 * Implementa el repositorio de usuarios utilizando TypeORM como adaptador.
 * @public
 * @see UserRepository
 */
export class UserTypeOrmAdapter implements UserRepository {
  constructor(
    @InjectPinoLogger(UserTypeOrmAdapter.name)
    private readonly logger: PinoLogger,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly handlerOrmErrorsService: HandlerOrmErrorsService,
  ) {}

  /**
   * Crea un usuario persistiendo la entidad en la base de datos.
   * @param user Datos de creación del usuario.
   * @returns Promesa con la entidad almacenada.
   * @throws DataBaseError Cuando ocurre un fallo de persistencia.
   */
  async create(user: UserCreateType): Promise<UserEntity> {
    try {
      this.logger.info({ createUser: user }, 'Creating new user...');
      const toPersist = this.userRepository.create(user);
      return await this.userRepository.save(toPersist);
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
   * @param id Identificador del usuario a modificar.
   * @param user Datos parciales para actualizar al usuario.
   * @returns Indicador de actualización exitosa.
   * @throws DataBaseError Cuando ocurre un fallo de persistencia.
   */
  async update(id: string, user: UserUpdateType): Promise<boolean> {
    try {
      this.logger.info({ updateUser: { id, user } }, 'Updating user...');
      const result = await this.userRepository.update({ email: id }, user);
      return !!result.affected;
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
      return await this.userRepository.findOne({ where: { id } });
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
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      this.logger.info({ findUserByEmail: email }, 'Finding user by email...');
      return await this.userRepository.findOne({ where: { email } });
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
      return await this.userRepository.find();
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, {
        notFound: 'User with this criteria not found',
        validation: 'Invalid user data provided',
        unknown: 'An unexpected error occurred while fetching users',
      });
    }
  }
}
