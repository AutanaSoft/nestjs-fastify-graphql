import { FindUserByEmailArgsDto } from '@/modules/users/applications/dto/args';
import { FindUserByEmailUseCase } from '@/modules/users/applications/use-cases';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { UserNotFoundError } from '@/modules/users/domain/errors';
import { UserRepository } from '@/modules/users/domain/repository';
import { PinoLogger } from 'nestjs-pino';

describe('FindUserByEmailUseCase', () => {
  let useCase: FindUserByEmailUseCase;
  let userRepositoryMock: UserRepositoryMock;
  let loggerMock: LoggerMock;

  const validEmail = 'test@example.com';

  const foundUserEntity: Partial<UserEntity> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userName: 'testuser',
    email: validEmail,
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

    useCase = new FindUserByEmailUseCase(
      userRepositoryMock as unknown as UserRepository,
      loggerMock as unknown as PinoLogger,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debe encontrar un usuario exitosamente por email válido', async () => {
      const query: FindUserByEmailArgsDto = {
        email: validEmail,
      };

      userRepositoryMock.findByEmail.mockResolvedValue(foundUserEntity as UserEntity);

      const result = await useCase.execute(query);

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(validEmail);
      expect(loggerMock.info).toHaveBeenCalledTimes(1);
      expect(loggerMock.info).toHaveBeenCalledWith(
        `User found with email: ${foundUserEntity.email}`,
      );
      expect(result).toEqual(foundUserEntity);
      expect(result.email).toBe(validEmail);
      expect(result.userName).toBe('testuser');
    });

    it('debe lanzar UserNotFoundError cuando el usuario no existe', async () => {
      const query: FindUserByEmailArgsDto = {
        email: validEmail,
      };

      userRepositoryMock.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(query)).rejects.toThrow(UserNotFoundError);
      await expect(useCase.execute(query)).rejects.toThrow(
        `User not found with email: ${validEmail}`,
      );
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledTimes(2);
      expect(loggerMock.warn).toHaveBeenCalledTimes(2);
      expect(loggerMock.warn).toHaveBeenCalledWith(`User not found with email: ${validEmail}`);
      expect(loggerMock.info).not.toHaveBeenCalled();
    });

    it('debe registrar warning cuando el usuario no se encuentra', async () => {
      const query: FindUserByEmailArgsDto = {
        email: validEmail,
      };

      userRepositoryMock.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(query)).rejects.toThrow(UserNotFoundError);
      expect(loggerMock.warn).toHaveBeenCalledWith(`User not found with email: ${validEmail}`);
    });

    it('debe registrar info cuando el usuario se encuentra exitosamente', async () => {
      const query: FindUserByEmailArgsDto = {
        email: validEmail,
      };

      userRepositoryMock.findByEmail.mockResolvedValue(foundUserEntity as UserEntity);

      await useCase.execute(query);

      expect(loggerMock.info).toHaveBeenCalledWith(
        `User found with email: ${foundUserEntity.email}`,
      );
    });

    it('debe propagar errores del repositorio cuando falla la búsqueda', async () => {
      const query: FindUserByEmailArgsDto = {
        email: validEmail,
      };

      const repositoryError = new Error('Database connection failed');
      userRepositoryMock.findByEmail.mockRejectedValue(repositoryError);

      await expect(useCase.execute(query)).rejects.toThrow('Database connection failed');
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledTimes(1);
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    it('debe buscar usuario con email diferente', async () => {
      const differentEmail = 'another@example.com';
      const query: FindUserByEmailArgsDto = {
        email: differentEmail,
      };

      const differentUser = { ...foundUserEntity, email: differentEmail };
      userRepositoryMock.findByEmail.mockResolvedValue(differentUser as UserEntity);

      const result = await useCase.execute(query);

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(differentEmail);
      expect(result.email).toBe(differentEmail);
    });

    it('debe buscar usuario con email en mayúsculas', async () => {
      const upperCaseEmail = 'TEST@EXAMPLE.COM';
      const query: FindUserByEmailArgsDto = {
        email: upperCaseEmail,
      };

      const userWithUpperEmail = { ...foundUserEntity, email: upperCaseEmail };
      userRepositoryMock.findByEmail.mockResolvedValue(userWithUpperEmail as UserEntity);

      const result = await useCase.execute(query);

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(upperCaseEmail);
      expect(result.email).toBe(upperCaseEmail);
    });

    it('debe retornar usuario con todos los campos correctos', async () => {
      const query: FindUserByEmailArgsDto = {
        email: validEmail,
      };

      userRepositoryMock.findByEmail.mockResolvedValue(foundUserEntity as UserEntity);

      const result = await useCase.execute(query);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userName');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('debe llamar al repositorio solo una vez por búsqueda', async () => {
      const query: FindUserByEmailArgsDto = {
        email: validEmail,
      };

      userRepositoryMock.findByEmail.mockResolvedValue(foundUserEntity as UserEntity);

      await useCase.execute(query);

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
      expect(userRepositoryMock.findById).not.toHaveBeenCalled();
      expect(userRepositoryMock.findAll).not.toHaveBeenCalled();
    });

    it('debe buscar usuario con email que contiene símbolos especiales', async () => {
      const specialEmail = 'user+test@example.com';
      const query: FindUserByEmailArgsDto = {
        email: specialEmail,
      };

      const userWithSpecialEmail = { ...foundUserEntity, email: specialEmail };
      userRepositoryMock.findByEmail.mockResolvedValue(userWithSpecialEmail as UserEntity);

      const result = await useCase.execute(query);

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(specialEmail);
      expect(result.email).toBe(specialEmail);
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
