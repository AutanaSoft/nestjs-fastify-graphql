import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DomainBaseError } from '@/shared/domain/errors';
import { UserEntity } from '../../domain/entities';
import { createUserNotFoundByEmailError } from '../../domain/errors';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { UserEmail } from '../../domain/value-objects';
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
   * @throws DomainBaseError Si el usuario no existe o si la operación falla.
   */
  async execute(query: FindUserByEmailArgsDto): Promise<UserEntity> {
    const userEmail = new UserEmail(query.email);
    const user = await this.userRepository.findByEmail(userEmail.getValue());

    if (user instanceof DomainBaseError) {
      throw user;
    }

    if (!user) {
      throw createUserNotFoundByEmailError(userEmail.getValue());
    }

    return user;
  }
}
