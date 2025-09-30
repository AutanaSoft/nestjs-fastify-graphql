import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserEntity } from '../../domain/entities';
import { UserNotFoundError, UserUpdateFailedError } from '../../domain/errors';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository';
import { UserName } from '../../domain/value-objects';
import { UpdateUserArgsDto } from '../dto/args';

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
  async execute(command: UpdateUserArgsDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findById(command.id);

    if (!existingUser) {
      throw new UserNotFoundError(`User with ID ${command.id} not found`);
    }

    const updateData: Record<string, unknown> = {};

    if (command.data.userName) {
      const userName = new UserName(command.data.userName);
      updateData.userName = userName.getValue();
    }

    if (command.data.status) {
      updateData.status = command.data.status;
    }

    if (command.data.role) {
      updateData.role = command.data.role;
    }

    const updated = await this.userRepository.update({
      id: command.id,
      data: updateData,
    });

    if (!updated) {
      this.logger.warn(`Failed to update user with ID: ${command.id}`);
      throw new UserUpdateFailedError(command.id);
    }

    this.logger.info(`User updated with ID: ${command.id}`);

    const updatedUser = await this.userRepository.findById(command.id);

    if (!updatedUser) {
      throw new UserNotFoundError(`User with ID ${command.id} not found after update`);
    }

    return updatedUser;
  }
}
