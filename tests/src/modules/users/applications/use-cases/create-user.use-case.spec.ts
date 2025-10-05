import { CreateUserArgsDto } from '@/modules/users/applications/dto/args';
import { CreateUserInputDto } from '@/modules/users/applications/dto/inputs';
import { CreateUserUseCase } from '@/modules/users/applications/use-cases';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import {
  ForbiddenEmailDomainError,
  ForbiddenUserNameError,
  UserCreationError,
} from '@/modules/users/domain/errors';
import { UserRepository } from '@/modules/users/domain/repository';
import * as HashUtilsModule from '@/shared/applications/utils/hash.utils';
import { PinoLogger } from 'nestjs-pino';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepositoryMock: UserRepositoryMock;
  let loggerMock: LoggerMock;
  let hashPasswordMock: jest.SpyInstance;

  const validUserInput: CreateUserInputDto = {
    userName: 'validuser',
    email: 'valid@example.com',
    password: 'ValidPass123!',
  };

  const createdUserEntity: Partial<UserEntity> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userName: 'validuser',
    email: 'valid@example.com',
    password: 'hashedPassword123',
    status: UserStatus.REGISTERED,
    role: UserRole.USER,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
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

    hashPasswordMock = jest.spyOn(HashUtilsModule.HashUtils, 'hashPassword');
    hashPasswordMock.mockResolvedValue('hashedPassword123');

    useCase = new CreateUserUseCase(
      userRepositoryMock as unknown as UserRepository,
      loggerMock as unknown as PinoLogger,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debe crear un usuario exitosamente con datos válidos', async () => {
      const command: CreateUserArgsDto = {
        data: validUserInput,
      };

      userRepositoryMock.create.mockResolvedValue(createdUserEntity as UserEntity);

      const result = await useCase.execute(command);

      expect(hashPasswordMock).toHaveBeenCalledTimes(1);
      expect(hashPasswordMock).toHaveBeenCalledWith(validUserInput.password);
      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.create).toHaveBeenCalledWith({
        userName: validUserInput.userName,
        email: validUserInput.email,
        password: 'hashedPassword123',
      });
      expect(loggerMock.debug).toHaveBeenCalledTimes(1);
      expect(loggerMock.debug).toHaveBeenCalledWith({ command }, 'Executing CreateUserUseCase');
      expect(loggerMock.info).toHaveBeenCalledTimes(1);
      expect(loggerMock.info).toHaveBeenCalledWith(
        { userId: createdUserEntity.id },
        'User created successfully',
      );
      expect(result).toEqual(createdUserEntity);
      expect(result.id).toBe(createdUserEntity.id);
      expect(result.userName).toBe('validuser');
      expect(result.email).toBe('valid@example.com');
    });

    it('debe lanzar ForbiddenUserNameError cuando el userName es "admin"', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'admin',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      await expect(useCase.execute(command)).rejects.toThrow('The username "admin" is not allowed');
      expect(hashPasswordMock).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError de forma case-insensitive (AutanaSoft)', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'AutanaSoft',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(hashPasswordMock).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenEmailDomainError cuando el dominio del email está prohibido', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          email: 'user@autanasoft.com',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenEmailDomainError);
      await expect(useCase.execute(command)).rejects.toThrow(
        'The email domain "autanasoft.com" from "user@autanasoft.com" is not allowed',
      );
      expect(hashPasswordMock).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe lanzar UserCreationError cuando la contraseña no cumple con complejidad mínima', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          password: 'simplepassword',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(UserCreationError);
      await expect(useCase.execute(command)).rejects.toThrow(
        'Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
      );
      expect(hashPasswordMock).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError cuando el userName contiene palabra prohibida como subcadena', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'admin123',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      await expect(useCase.execute(command)).rejects.toThrow(
        'The username "admin123" is not allowed',
      );
      expect(hashPasswordMock).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe propagar errores del repositorio cuando falla la creación', async () => {
      const command: CreateUserArgsDto = {
        data: validUserInput,
      };

      const repositoryError = new Error('Database connection failed');
      userRepositoryMock.create.mockRejectedValue(repositoryError);

      await expect(useCase.execute(command)).rejects.toThrow('Database connection failed');
      expect(hashPasswordMock).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(loggerMock.info).not.toHaveBeenCalled();
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
