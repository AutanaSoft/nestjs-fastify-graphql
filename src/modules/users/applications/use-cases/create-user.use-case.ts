import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { CreateUserArgsDto } from '../dto/args';

/**
 * Caso de uso para crear un usuario en el sistema.
 *
 * Orquesta la operación de creación delegando en el repositorio de
 * usuarios y registra el resultado en el logger de la aplicación.
 *
 * @public
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @InjectPinoLogger(CreateUserUseCase.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta la creación de un usuario.
   *
   * @param command Argumentos que contienen los datos de entrada.
   * @returns La entidad de usuario creada.
   * @throws Error Si la operación de persistencia falla.
   * @remarks Delegado en el repositorio y registra un log informativo.
   */
  async execute(command: CreateUserArgsDto): Promise<UserEntity> {
    const user = await this.userRepository.create(command.data);
    this.logger.info(`User created with ID: ${user.id}`);
    return user;
  }
}
