import { HashUtils } from '@/shared/applications/utils';
import { DomainBaseError } from '@/shared/domain/errors';
import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { createUserNotFoundError } from '../../domain/errors';
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
   * @throws DomainBaseError Si el usuario no existe, el nombre está prohibido, o la operación falla.
   * @remarks Valida la existencia del usuario antes de aplicar la actualización.
   */
  async execute(command: UserUpdateType): Promise<UserEntity> {
    this.logger.info({ command }, 'Executing UpdateUserUseCase');
    const { id, data } = command;

    const existingUser = await this.userRepository.findById(id);

    if (existingUser instanceof DomainBaseError) {
      throw existingUser;
    }

    if (!existingUser) {
      throw createUserNotFoundError(id);
    }

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

    if (updated instanceof DomainBaseError) {
      throw updated;
    }

    this.logger.info({ userId: updated.id }, 'User updated successfully');
    return updated;
  }
}
