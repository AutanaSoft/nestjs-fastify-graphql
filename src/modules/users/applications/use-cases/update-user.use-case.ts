import { HashUtils } from '@/shared/applications/utils';
import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { UserNotFoundError } from '../../domain/errors';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { UserUpdateType } from '../../domain/types';
import { UserEmail, UserName, UserPassword } from '../../domain/value-objects';

/**
 * Caso de uso para actualizar un usuario existente en el sistema.
 *
 * Orquesta la operación de actualización validando la existencia del usuario,
 * procesando los datos de entrada a través de value objects cuando corresponde,
 * y delegando la persistencia en el repositorio de usuarios.
 *
 * @public
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @InjectPinoLogger(UpdateUserUseCase.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta la actualización de un usuario.
   *
   * @param command Argumentos que contienen el ID del usuario y los datos a actualizar.
   * @returns La entidad de usuario actualizada.
   * @throws UserNotFoundError Si el usuario con el ID especificado no existe.
   * @throws ForbiddenUserNameError Si el nombre de usuario está prohibido.
   * @throws UserUpdateFailedError Si la operación de actualización falla en el repositorio.
   * @remarks Valida la existencia del usuario antes de aplicar la actualización.
   */
  async execute(command: UserUpdateType): Promise<UserEntity> {
    const { id, data } = command;

    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) throw new UserNotFoundError(`User with ID ${id} not found`);

    // Validamos el userName si viene en los datos a actualizar
    if (data.userName) {
      const userName = new UserName(data.userName);
      data.userName = userName.getValue();
    }

    // Validamos el email si viene en los datos a actualizar
    if (data.email) {
      const userEmail = new UserEmail(data.email);
      data.email = userEmail.getValue();
    }

    // Validamos el password si viene en los datos a actualizar
    if (data.password) {
      const userPassword = new UserPassword(data.password);
      data.password = await HashUtils.hashPassword(userPassword.getValue());
    }

    // Persistimos la actualización
    const updated = await this.userRepository.update({
      id,
      data,
    });

    return updated;
  }
}
