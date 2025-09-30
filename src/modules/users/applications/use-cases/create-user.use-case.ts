import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { UserName } from '../../domain/value-objects';
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
   * @throws ForbiddenUserNameError Si el nombre de usuario está prohibido.
   * @throws Error Si la operación de persistencia falla.
   * @remarks Valida que el nombre de usuario no esté prohibido antes de delegar en el repositorio.
   */
  async execute(command: CreateUserArgsDto): Promise<UserEntity> {
    const userName = new UserName(command.data.userName);
    const user = await this.userRepository.create({
      ...command.data,
      userName: userName.getValue(),
    });
    this.logger.info(`User created with ID: ${user.id}`);
    return user;
  }
}
