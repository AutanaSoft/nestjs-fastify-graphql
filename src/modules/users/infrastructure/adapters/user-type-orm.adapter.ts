import { UserNotFoundError } from '@/modules/users/domain/errors/user.errors';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { QueryFailedError, Repository } from 'typeorm';
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
    const toPersist = this.userRepository.create(user);
    try {
      this.logger.debug({ email: (toPersist as Partial<UserEntity>).email }, 'Creating user');
      const saved = await this.userRepository.save(toPersist);
      this.logger.info({ id: saved.id, email: saved.email }, 'User created');
      return saved;
    } catch (err) {
      this.logger.error({ ...this.getErrorContext(err) }, 'Unexpected error while creating user');
      if (err instanceof Error) throw err;
      throw err;
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
