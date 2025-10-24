import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DomainBaseError } from '@/shared/domain/errors';
import { UserEntity } from '../../domain/entities';
import { createUserNotFoundError } from '../../domain/errors';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { FindUserByIdArgsDto } from '../dto/args';

/**
 * Caso de uso para buscar un usuario por su identificador.
 *
 * Orquesta la operación de búsqueda delegando en el repositorio de
 * usuarios y registra el resultado en el logger de la aplicación.
 *
 * @public
 */
@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @InjectPinoLogger(FindUserByIdUseCase.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta la búsqueda de un usuario por ID.
   *
   * @param query Argumentos que contienen el identificador del usuario.
   * @returns La entidad de usuario encontrada.
   * @throws DomainBaseError Si el usuario no existe o si la operación falla.
   */
  async execute(query: FindUserByIdArgsDto): Promise<UserEntity> {
    const user = await this.userRepository.findById(query.id);

    if (user instanceof DomainBaseError) {
      throw user;
    }

    if (!user) {
      throw createUserNotFoundError(query.id);
    }

    return user;
  }
}
