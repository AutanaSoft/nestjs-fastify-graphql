import { UpdateUserUseCase } from '@/modules/users/applications/use-cases';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import {
  ForbiddenEmailDomainError,
  ForbiddenUserNameError,
  UserCreationError,
  UserNotFoundError,
} from '@/modules/users/domain/errors';
import { UserRepository } from '@/modules/users/domain/repository';
import { UserUpdateType } from '@/modules/users/domain/types';
import { PinoLogger } from 'nestjs-pino';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let userRepositoryMock: UserRepositoryMock;
  let loggerMock: LoggerMock;

  const existingUserId = '123e4567-e89b-12d3-a456-426614174000';

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
    describe('UserName validations', () => {
      it('debe actualizar un usuario exitosamente con userName válido', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'updateduser',
          },
        };

        userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
        userRepositoryMock.update.mockResolvedValueOnce(updatedUserEntity as UserEntity);

        const result = await useCase.execute(command);

        expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
        expect(userRepositoryMock.findById).toHaveBeenCalledWith(existingUserId);
        expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
        expect(userRepositoryMock.update).toHaveBeenCalledWith({
          id: existingUserId,
          data: {
            userName: 'updateduser',
          },
        });
        expect(result).toEqual(updatedUserEntity);
        expect(result.userName).toBe('updateduser');
      });

      it('debe lanzar ForbiddenUserNameError cuando el userName es "admin"', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'admin',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'The username "admin" is not allowed',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar ForbiddenUserNameError cuando el userName es "root"', async () => {
        const command: UserUpdateType = {
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
        const command: UserUpdateType = {
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
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'ADMIN',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar ForbiddenUserNameError cuando el userName contiene nombre prohibido como subcadena', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'admin123',
          },
        };

        userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar ForbiddenUserNameError cuando el userName es "administrator"', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'administrator',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });
    });

    describe('Email validations', () => {
      it('debe actualizar usuario con email válido y normalizarlo a minúsculas', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            email: 'NewEmail@Example.COM',
          },
        };

        const expectedUser = {
          ...updatedUserEntity,
          email: 'newemail@example.com',
        };
        userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
        userRepositoryMock.update.mockResolvedValueOnce(expectedUser as UserEntity);

        const result = await useCase.execute(command);

        expect(userRepositoryMock.update).toHaveBeenCalledWith({
          id: existingUserId,
          data: {
            email: 'newemail@example.com',
          },
        });
        expect(result.email).toBe('newemail@example.com');
      });

      it('debe lanzar UserCreationError cuando el email es inválido', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            email: 'invalid-email',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'Email must be a valid email address.',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar UserCreationError cuando el email está vacío', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            email: '   ',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow('Email is required.');
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar UserCreationError cuando el email excede la longitud máxima', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            email: 'a'.repeat(60) + '@example.com',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'Email must be at most 64 characters long.',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar ForbiddenEmailDomainError cuando el dominio del email está prohibido (autanasoft.com)', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            email: 'user@autanasoft.com',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(ForbiddenEmailDomainError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'The email domain "autanasoft.com" from "user@autanasoft.com" is not allowed',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar ForbiddenEmailDomainError cuando el dominio está prohibido (airdashboard.net)', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            email: 'test@airdashboard.net',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(ForbiddenEmailDomainError);
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });
    });

    describe('Password validations', () => {
      it('debe actualizar usuario con password válido y hashearlo', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            password: 'NewP@ssw0rd',
          },
        };

        userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
        userRepositoryMock.update.mockResolvedValueOnce(updatedUserEntity as UserEntity);

        const result = await useCase.execute(command);

        expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
        const calls = userRepositoryMock.update.mock.calls as Array<[UserUpdateType]>;
        expect(calls[0]).toBeDefined();
        const updateCall = calls[0][0];
        expect(updateCall.id).toBe(existingUserId);
        expect(updateCall.data.password).toBeDefined();
        expect(updateCall.data.password).not.toBe('NewP@ssw0rd');
        expect(updateCall.data.password?.startsWith('$2b$')).toBe(true);
        expect(result).toEqual(updatedUserEntity);
      });

      it('debe lanzar UserCreationError cuando el password es muy corto', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            password: 'P@ss1',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'Password must be at least 8 characters long.',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar UserCreationError cuando el password no tiene mayúscula', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            password: 'password123@',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar UserCreationError cuando el password no tiene minúscula', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            password: 'PASSWORD123@',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar UserCreationError cuando el password no tiene dígito', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            password: 'Password@',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar UserCreationError cuando el password no tiene carácter especial', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            password: 'Password123',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow(
          'Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
        );
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe lanzar UserCreationError cuando el password está vacío', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            password: '   ',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);

        await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
        await expect(useCase.execute(command)).rejects.toThrow('Password is required.');
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });
    });

    describe('General update scenarios', () => {
      it('debe lanzar UserNotFoundError cuando el usuario no existe', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'newusername',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(null);

        await expect(useCase.execute(command)).rejects.toThrow(UserNotFoundError);
        await expect(useCase.execute(command)).rejects.toThrow(
          `User with ID ${existingUserId} not found`,
        );
        expect(userRepositoryMock.findById).toHaveBeenCalledWith(existingUserId);
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe propagar errores del repositorio cuando falla la búsqueda inicial', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'newusername',
          },
        };

        const repositoryError = new Error('Database connection failed');
        userRepositoryMock.findById.mockRejectedValue(repositoryError);

        await expect(useCase.execute(command)).rejects.toThrow('Database connection failed');
        expect(userRepositoryMock.update).not.toHaveBeenCalled();
      });

      it('debe propagar errores del repositorio cuando falla la actualización', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'newusername',
          },
        };

        userRepositoryMock.findById.mockResolvedValue(existingUserEntity as UserEntity);
        const repositoryError = new Error('Database constraint violation');
        userRepositoryMock.update.mockRejectedValue(repositoryError);

        await expect(useCase.execute(command)).rejects.toThrow('Database constraint violation');
      });

      it('debe manejar actualización con datos vacíos (sin cambios)', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {},
        };

        userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
        userRepositoryMock.update.mockResolvedValueOnce(existingUserEntity as UserEntity);

        const result = await useCase.execute(command);

        expect(userRepositoryMock.update).toHaveBeenCalledWith({
          id: existingUserId,
          data: {},
        });
        expect(result).toEqual(existingUserEntity);
      });

      it('debe actualizar múltiples campos simultáneamente (userName, email, password)', async () => {
        const command: UserUpdateType = {
          id: existingUserId,
          data: {
            userName: 'newusername',
            email: 'new@example.com',
            password: 'NewP@ssw0rd123',
          },
        };

        const expectedUser = {
          ...updatedUserEntity,
          userName: 'newusername',
          email: 'new@example.com',
        };
        userRepositoryMock.findById.mockResolvedValueOnce(existingUserEntity as UserEntity);
        userRepositoryMock.update.mockResolvedValueOnce(expectedUser as UserEntity);

        const result = await useCase.execute(command);

        expect(userRepositoryMock.update).toHaveBeenCalledTimes(1);
        const calls = userRepositoryMock.update.mock.calls as Array<[UserUpdateType]>;
        expect(calls[0]).toBeDefined();
        const updateCall = calls[0][0];
        expect(updateCall.id).toBe(existingUserId);
        expect(updateCall.data.userName).toBe('newusername');
        expect(updateCall.data.email).toBe('new@example.com');
        expect(updateCall.data.password).toBeDefined();
        expect(updateCall.data.password?.startsWith('$2b$')).toBe(true);
        expect(result.userName).toBe('newusername');
        expect(result.email).toBe('new@example.com');
      });
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
