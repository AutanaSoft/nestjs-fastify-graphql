import { HashUtils } from '@/shared/applications/utils';
import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { UserEmail, UserName, UserPassword } from '../../domain/value-objects';
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
   * @throws ForbiddenEmailDomainError Si el dominio del email está prohibido.
   * @throws Error Si la operación de persistencia falla.
   * @remarks Valida que el nombre de usuario y el dominio del email no estén prohibidos antes de delegar en el repositorio.
   */
  async execute(command: CreateUserArgsDto): Promise<UserEntity> {
    const userName = new UserName(command.data.userName);
    const userEmail = new UserEmail(command.data.email);
    const userPassword = new UserPassword(command.data.password);
    const hashedPassword = await HashUtils.hashPassword(userPassword.getValue());
    const user = await this.userRepository.create({
      ...command.data,
      userName: userName.getValue(),
      email: userEmail.getValue(),
      password: hashedPassword,
    });
    this.logger.info(`User created with ID: ${user.id}`);
    return user;
  }
}
