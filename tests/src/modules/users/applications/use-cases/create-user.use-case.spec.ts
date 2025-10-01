import { CreateUserArgsDto } from '@/modules/users/applications/dto/args';
import { CreateUserInputDto } from '@/modules/users/applications/dto/inputs';
import { CreateUserUseCase } from '@/modules/users/applications/use-cases';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { ForbiddenUserNameError } from '@/modules/users/domain/errors';
import { UserRepository } from '@/modules/users/domain/repository';
import { PinoLogger } from 'nestjs-pino';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepositoryMock: UserRepositoryMock;
  let loggerMock: LoggerMock;

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

      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.create).toHaveBeenCalledWith({
        userName: validUserInput.userName,
        email: validUserInput.email,
        password: validUserInput.password,
      });
      expect(loggerMock.info).toHaveBeenCalledTimes(1);
      expect(loggerMock.info).toHaveBeenCalledWith(`User created with ID: ${createdUserEntity.id}`);
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
      await expect(useCase.execute(command)).rejects.toThrow('The username admin is not allowed');
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError cuando el userName es "root"', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'root',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError cuando el userName es "autanasoft"', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'autanasoft',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError de forma case-insensitive (ADMIN)', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'ADMIN',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenUserNameError de forma case-insensitive (AutanaSoft)', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'AutanaSoft',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe crear usuario con userName que no está prohibido', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'myusername',
        },
      };

      const expectedUser = { ...createdUserEntity, userName: 'myusername' };
      userRepositoryMock.create.mockResolvedValue(expectedUser as UserEntity);

      const result = await useCase.execute(command);

      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(result.userName).toBe('myusername');
    });

    it('debe propagar errores del repositorio cuando falla la creación', async () => {
      const command: CreateUserArgsDto = {
        data: validUserInput,
      };

      const repositoryError = new Error('Database connection failed');
      userRepositoryMock.create.mockRejectedValue(repositoryError);

      await expect(useCase.execute(command)).rejects.toThrow('Database connection failed');
      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe validar userName antes de llamar al repositorio', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'administrator',
        },
      };

      await expect(useCase.execute(command)).rejects.toThrow(ForbiddenUserNameError);
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe crear usuario con userName que contiene nombre prohibido como subcadena', async () => {
      const command: CreateUserArgsDto = {
        data: {
          ...validUserInput,
          userName: 'admin123',
        },
      };

      const expectedUser = { ...createdUserEntity, userName: 'admin123' };
      userRepositoryMock.create.mockResolvedValue(expectedUser as UserEntity);

      const result = await useCase.execute(command);

      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(result.userName).toBe('admin123');
    });

    it('debe registrar el ID del usuario creado en el logger', async () => {
      const command: CreateUserArgsDto = {
        data: validUserInput,
      };

      userRepositoryMock.create.mockResolvedValue(createdUserEntity as UserEntity);

      await useCase.execute(command);

      expect(loggerMock.info).toHaveBeenCalledWith(`User created with ID: ${createdUserEntity.id}`);
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
