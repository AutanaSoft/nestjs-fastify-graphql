import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { UserNotFoundError } from '../../domain/errors';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { FindUserByEmailArgsDto } from '../dto/args';

/**
 * Caso de uso para buscar un usuario por su dirección de correo electrónico.
 *
 * Orquesta la operación de búsqueda delegando en el repositorio de
 * usuarios y registra el resultado en el logger de la aplicación.
 *
 * @public
 */
@Injectable()
export class FindUserByEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @InjectPinoLogger(FindUserByEmailUseCase.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta la búsqueda de un usuario por email.
   *
   * @param query Argumentos que contienen el email del usuario.
   * @returns La entidad de usuario encontrada.
   * @throws UserNotFoundError Si el usuario no existe.
   * @throws Error Si la operación de búsqueda falla.
   */
  async execute(query: FindUserByEmailArgsDto): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(query.email);
    if (!user) {
      this.logger.warn(`User not found with email: ${query.email}`);
      throw new UserNotFoundError(`User not found with email: ${query.email}`);
    }
    this.logger.info(`User found with email: ${user.email}`);
    return user;
  }
}
