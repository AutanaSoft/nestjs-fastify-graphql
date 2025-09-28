import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { CreateUserArgsDto } from '../dto/args';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @InjectPinoLogger(CreateUserUseCase.name) private readonly logger: PinoLogger,
  ) {}

  async execute(command: CreateUserArgsDto): Promise<UserEntity> {
    const user = await this.userRepository.create(command.data);
    this.logger.info(`User created with ID: ${user.id}`);
    return user;
  }
}
