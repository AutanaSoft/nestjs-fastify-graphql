import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EntityNotFoundError, QueryFailedError, Repository } from 'typeorm';

import {
  UserAlreadyExistsError,
  UserForeignKeyViolationError,
  UserNotFoundError,
} from '@/modules/users/domain/errors/user.errors';
import { DataBaseError } from '@/shared/domain/errors';
import { UserEntity } from '../../domain/entities';
import { UserRepository } from '../../domain/repository';
import { UserCreateType, UserUpdateType } from '../../domain/types';

@Injectable()
export class UserTypeOrmAdapter implements UserRepository {
  constructor(
    @InjectPinoLogger(UserTypeOrmAdapter.name)
    private readonly logger: PinoLogger,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async create(user: UserCreateType): Promise<UserEntity> {
    try {
      const toPersist = this.userRepository.create(user);
      this.logger.debug({ email: (toPersist as Partial<UserEntity>).email }, 'Creating user');
      const saved = await this.userRepository.save(toPersist);
      this.logger.info({ id: saved.id, email: saved.email }, 'User created');
      return saved;
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        this.logger.warn(
          { email: user.email, ...this.getErrorContext(err) },
          'Unique violation while creating user',
        );
        throw new UserAlreadyExistsError(`User with email ${user.email} already exists`);
      }
      if (this.isForeignKeyViolation(err)) {
        this.logger.warn(
          { email: user.email, ...this.getErrorContext(err) },
          'Foreign key violation while creating user',
        );
        throw new UserForeignKeyViolationError(
          `Related record not found while creating user with email ${user.email}`,
        );
      }
      if (this.isEntityNotFoundError(err)) {
        this.logger.warn(
          { email: user.email, ...this.getErrorContext(err) },
          'Referenced record not found while creating user',
        );
        throw new UserNotFoundError(`Referenced record not found while creating user`);
      }
      if (this.isConnectionError(err)) {
        this.logger.error(
          { email: user.email, ...this.getErrorContext(err) },
          'Database connection error while creating user',
        );
        throw new DataBaseError('Database connection error while creating user');
      }
      this.logger.error(
        { email: user.email, ...this.getErrorContext(err) },
        'Unexpected error while creating user',
      );
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(String(err));
    }
  }

  async update(id: string, user: UserUpdateType): Promise<UserEntity> {
    try {
      this.logger.debug({ email: id }, 'Updating user');
      const result = await this.userRepository.update({ email: id }, user);
      if (!result.affected) {
        this.logger.warn({ email: id }, 'User not found to update');
        throw new UserNotFoundError(`User with email ${id} not found`);
      }
      const updatedUser = await this.userRepository.findOne({ where: { email: id } });
      if (!updatedUser) {
        this.logger.error({ email: id }, 'User not found after update');
        throw new UserNotFoundError(`User with email ${id} not found`);
      }
      this.logger.info({ id: updatedUser.id, email: updatedUser.email }, 'User updated');
      return updatedUser;
    } catch (err) {
      this.logger.error(
        { email: id, ...this.getErrorContext(err) },
        'Unexpected error while updating user',
      );
      if (err instanceof Error) throw err;
      throw err;
    }
  }

  async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      return user;
    } catch (err) {
      this.logger.error({ id, ...this.getErrorContext(err) }, 'Error while finding user by id');
      throw err as Error;
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      return user;
    } catch (err) {
      this.logger.error(
        { email, ...this.getErrorContext(err) },
        'Error while finding user by email',
      );
      throw err as Error;
    }
  }

  async findAll(): Promise<UserEntity[]> {
    try {
      const users = await this.userRepository.find();
      return users;
    } catch (err) {
      this.logger.error({ ...this.getErrorContext(err) }, 'Error while finding all users');
      throw err as Error;
    }
  }

  private isUniqueViolation(err: unknown): boolean {
    if (err instanceof QueryFailedError) {
      const code = (err as unknown as { driverError?: { code?: string } })?.driverError?.code;
      return code === '23505';
    }
    return false;
  }

  private isForeignKeyViolation(err: unknown): boolean {
    if (err instanceof QueryFailedError) {
      const code = (err as unknown as { driverError?: { code?: string } })?.driverError?.code;
      return code === '23503';
    }
    return false;
  }

  private isEntityNotFoundError(err: unknown): err is EntityNotFoundError {
    return err instanceof EntityNotFoundError;
  }

  private isConnectionError(err: unknown): boolean {
    const connectionCodes = new Set([
      '08000',
      '08003',
      '08006',
      '08001',
      '08004',
      '08007',
      '08P01',
      '57P01',
      '57P02',
      '57P03',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'EPIPE',
      'EHOSTUNREACH',
    ]);

    if (err instanceof QueryFailedError) {
      const driver = (err as { driverError?: { code?: string } }).driverError;
      if (driver?.code && connectionCodes.has(driver.code)) {
        return true;
      }
    }

    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code?: string }).code;
      if (code && connectionCodes.has(code)) {
        return true;
      }
    }

    return false;
  }

  private getErrorContext(err: unknown): Record<string, unknown> {
    if (err instanceof QueryFailedError) {
      const driver = (err as { driverError?: { code?: string; detail?: unknown } }).driverError;
      return {
        name: err.name,
        message: err.message,
        code: driver?.code,
        detail: driver?.detail,
      } as const;
    }
    if (err instanceof Error) {
      return {
        name: err.name,
        message: err.message,
        stack: err.stack,
      } as const;
    }
    return { error: String(err) } as const;
  }
}
