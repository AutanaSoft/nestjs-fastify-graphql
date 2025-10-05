import { HashUtils } from '@/shared/applications/utils';
import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { UserEmail, UserName, UserPassword } from '../../domain/value-objects';
import { CreateUserArgsDto } from '../dto/args';

/**
 * Caso de uso para crear un nuevo usuario en el sistema.
 *
 * Valida los datos de entrada usando value objects del dominio,
 * hashea la contraseña del usuario y persiste la entidad en el repositorio.
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
   * Ejecuta la creación de un nuevo usuario.
   *
   * @param command - Argumentos que contienen los datos del usuario a crear
   * @returns La entidad de usuario creada con su ID asignado
   * @throws {UserAlreadyExistsError} Si el email o nombre de usuario ya existe
   * @throws {ValidationError} Si los datos del usuario no son válidos
   */
  async execute(command: CreateUserArgsDto): Promise<UserEntity> {
    this.logger.info({ command }, 'Executing CreateUserUseCase');

    // Validar si el usuario ya existe por email o nombre de usuario
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

    this.logger.info({ userId: user.id }, 'User created successfully');
    return user;
  }
}
