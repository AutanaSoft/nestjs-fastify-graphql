import { UpdateUserArgsDto } from '@/modules/users/applications/dto/args';
import { UpdateUserInputDto } from '@/modules/users/applications/dto/inputs';
import { UpdateUserUseCase } from '@/modules/users/applications/use-cases';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import {
  ForbiddenUserNameError,
  UserNotFoundError,
  UserUpdateFailedError,
} from '@/modules/users/domain/errors';
import { UserRepository } from '@/modules/users/domain/repository';
import { PinoLogger } from 'nestjs-pino';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let userRepositoryMock: UserRepositoryMock;
  let loggerMock: LoggerMock;

  const existingUserId = '123e4567-e89b-12d3-a456-426614174000';

  const validUserInput: UpdateUserInputDto = {
    userName: 'updateduser',
  };

  const existingUserEntity: Partial<UserEntity> = {
    id: existingUserId,
    userName: 'originaluser',
    email: 'original@example.com',
    password: 'hashedPassword123',
    status: UserStatus.REGISTERED,
    role: UserRole.USER,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  const updatedUserEntity: Partial<UserEntity> = {
    ...existingUserEntity,
    userName: 'updateduser',
    updatedAt: new Date('2025-01-02T00:00:00Z'),
  };

  beforeEach(() => {
    userRepositoryMock = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };

    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as LoggerMock;

    useCase = new UpdateUserUseCase(
      userRepositoryMock as unknown as UserRepository,
      loggerMock as unknown as PinoLogger,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debe actualizar un usuario exitosamente con datos válidos', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: validUserInput,
      };

      userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
      userRepositoryMock.update.mockResolvedValue(true);
      userRepositoryMock.findById.mockResolvedValueOnce(updatedUserEntity as UserEntity);

      const result = await useCase.execute(command);

      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(2);
      expect(userRepositoryMock.findById).toHaveBeenNthCalledWith(1, existingUserId);
      expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.update).toHaveBeenCalledWith({
        id: existingUserId,
        data: {
          userName: validUserInput.userName,
        },
      });
      expect(loggerMock.info).toHaveBeenCalledTimes(1);
      expect(loggerMock.info).toHaveBeenCalledWith(`User updated with ID: ${existingUserId}`);
      expect(result).toEqual(updatedUserEntity);
      expect(result.userName).toBe('updateduser');
    });

    it('debe lanzar UserNotFoundError cuando el usuario no existe', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: validUserInput,
      };

      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(command)).rejects.toThrow(UserNotFoundError);
      await expect(useCase.execute(command)).rejects.toThrow(
        `User with ID ${existingUserId} not found`,
      );
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(existingUserId);
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError cuando el userName es "admin"', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: {
          userName: 'admin',
        },
      };

      userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      await expect(useCase.execute(command)).rejects.toThrow('The username admin is not allowed');
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError cuando el userName es "root"', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: {
          userName: 'root',
        },
      };

      userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError cuando el userName es "autanasoft"', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: {
          userName: 'autanasoft',
        },
      };

      userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError de forma case-insensitive (ADMIN)', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: {
          userName: 'ADMIN',
        },
      };

      userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('debe lanzar UserUpdateFailedError cuando la actualización falla en el repositorio', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: validUserInput,
      };

      userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);
      userRepositoryMock.update.mockResolvedValue(false);

      await expect(useCase.execute(command)).rejects.toThrow(UserUpdateFailedError);
      await expect(useCase.execute(command)).rejects.toThrow(
        `Failed to update user with ID ${existingUserId}`,
      );
      expect(loggerMock.warn).toHaveBeenCalledWith(
        `Failed to update user with ID: ${existingUserId}`,
      );
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe actualizar usuario con userName que no está prohibido', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: {
          userName: 'mynewusername',
        },
      };

      const expectedUser = { ...updatedUserEntity, userName: 'mynewusername' };
      userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
      userRepositoryMock.update.mockResolvedValue(true);
      userRepositoryMock.findById.mockResolvedValueOnce(expectedUser as UserEntity);

      const result = await useCase.execute(command);

      expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(result.userName).toBe('mynewusername');
    });

    it('debe propagar errores del repositorio cuando falla la búsqueda inicial', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: validUserInput,
      };

      const repositoryError = new Error('Database connection failed');
      userRepositoryMock.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute(command)).rejects.toThrow('Database connection failed');
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe propagar errores del repositorio cuando falla la actualización', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: validUserInput,
      };

      userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);
      const repositoryError = new Error('Database constraint violation');
      userRepositoryMock.update.mockRejectedValue(repositoryError);

      await expect(useCase.execute(command)).rejects.toThrow('Database constraint violation');
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe validar userName antes de llamar al repositorio update', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: {
          userName: 'administrator',
        },
      };

      userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('debe actualizar usuario con userName que contiene nombre prohibido como subcadena', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: {
          userName: 'admin123',
        },
      };

      const expectedUser = { ...updatedUserEntity, userName: 'admin123' };
      userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
      userRepositoryMock.update.mockResolvedValue(true);
      userRepositoryMock.findById.mockResolvedValueOnce(expectedUser as UserEntity);

      const result = await useCase.execute(command);

      expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(result.userName).toBe('admin123');
    });

    it('debe registrar el ID del usuario actualizado en el logger', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: validUserInput,
      };

      userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
      userRepositoryMock.update.mockResolvedValue(true);
      userRepositoryMock.findById.mockResolvedValueOnce(updatedUserEntity as UserEntity);

      await useCase.execute(command);

      expect(loggerMock.info).toHaveBeenCalledWith(`User updated with ID: ${existingUserId}`);
    });

    it('debe lanzar UserNotFoundError si el usuario no se encuentra después de la actualización', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: validUserInput,
      };

      userRepositoryMock.findById
        .mockResolvedValueOnce(existingUserEntity as UserEntity)
        .mockResolvedValueOnce(null);
      userRepositoryMock.update.mockResolvedValue(true);

      const error = useCase.execute(command);

      await expect(error).rejects.toThrow(UserNotFoundError);
      await expect(error).rejects.toThrow('not found after update');
    });

    it('debe manejar actualización con datos vacíos (sin cambios)', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: {},
      };

      userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
      userRepositoryMock.update.mockResolvedValue(true);
      userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);

      const result = await useCase.execute(command);

      expect(userRepositoryMock.update).toHaveBeenCalledWith({
        id: existingUserId,
        data: {},
      });
      expect(result).toEqual(existingUserEntity);
    });

    it('debe verificar la existencia del usuario antes de procesar la actualización', async () => {
      const command: UpdateUserArgsDto = {
        id: existingUserId,
        data: validUserInput,
      };

      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(command)).rejects.toThrow(UserNotFoundError);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(existingUserId);
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });
  });
});

interface UserRepositoryMock {
  create: jest.Mock;
  update: jest.Mock;
  findById: jest.Mock;
  findByEmail: jest.Mock;
  findAll: jest.Mock;
}

type LoggerMock = jest.Mocked<Pick<PinoLogger, 'info' | 'error' | 'warn' | 'debug'>>;
