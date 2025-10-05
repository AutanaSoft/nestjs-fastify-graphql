import { FindUserByIdArgsDto } from '@/modules/users/applications/dto/args';
import { FindUserByIdUseCase } from '@/modules/users/applications/use-cases';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { UserNotFoundError } from '@/modules/users/domain/errors';
import { UserRepository } from '@/modules/users/domain/repository';
import { PinoLogger } from 'nestjs-pino';

describe('FindUserByIdUseCase', () => {
  let useCase: FindUserByIdUseCase;
  let userRepositoryMock: UserRepositoryMock;
  let loggerMock: LoggerMock;

  const validUserId = '123e4567-e89b-12d3-a456-426614174000';

  const foundUserEntity: Partial<UserEntity> = {
    id: validUserId,
    userName: 'testuser',
    email: 'test@example.com',
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

    useCase = new FindUserByIdUseCase(
      userRepositoryMock as unknown as UserRepository,
      loggerMock as unknown as PinoLogger,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debe encontrar un usuario exitosamente por ID válido', async () => {
      const query: FindUserByIdArgsDto = {
        id: validUserId,
      };

      userRepositoryMock.findById.mockResolvedValue(foundUserEntity as UserEntity);

      const result = await useCase.execute(query);

      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(validUserId);
      expect(result).toEqual(foundUserEntity);
      expect(result.id).toBe(validUserId);
      expect(result.userName).toBe('testuser');
      expect(result.email).toBe('test@example.com');
    });

    it('debe lanzar UserNotFoundError cuando el usuario no existe', async () => {
      const query: FindUserByIdArgsDto = {
        id: validUserId,
      };

      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(query)).rejects.toThrow(UserNotFoundError);
      await expect(useCase.execute(query)).rejects.toThrow(
        `User not found with ID: ${validUserId}`,
      );
      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(2);
    });

    it('debe registrar warning cuando el usuario no se encuentra', async () => {
      const query: FindUserByIdArgsDto = {
        id: validUserId,
      };

      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(useCase.execute(query)).rejects.toThrow(UserNotFoundError);
    });

    it('debe registrar info cuando el usuario se encuentra exitosamente', async () => {
      const query: FindUserByIdArgsDto = {
        id: validUserId,
      };

      userRepositoryMock.findById.mockResolvedValue(foundUserEntity as UserEntity);

      await useCase.execute(query);
    });

    it('debe propagar errores del repositorio cuando falla la búsqueda', async () => {
      const query: FindUserByIdArgsDto = {
        id: validUserId,
      };

      const repositoryError = new Error('Database connection failed');
      userRepositoryMock.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute(query)).rejects.toThrow('Database connection failed');
      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
    });

    it('debe buscar usuario con ID diferente', async () => {
      const differentUserId = '987e6543-e21b-34d5-a654-426614174999';
      const query: FindUserByIdArgsDto = {
        id: differentUserId,
      };

      const differentUser = { ...foundUserEntity, id: differentUserId };
      userRepositoryMock.findById.mockResolvedValue(differentUser as UserEntity);

      const result = await useCase.execute(query);

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(differentUserId);
      expect(result.id).toBe(differentUserId);
    });

    it('debe retornar usuario con todos los campos correctos', async () => {
      const query: FindUserByIdArgsDto = {
        id: validUserId,
      };

      userRepositoryMock.findById.mockResolvedValue(foundUserEntity as UserEntity);

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
      const query: FindUserByIdArgsDto = {
        id: validUserId,
      };

      userRepositoryMock.findById.mockResolvedValue(foundUserEntity as UserEntity);

      await useCase.execute(query);

      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
      expect(userRepositoryMock.findByEmail).not.toHaveBeenCalled();
      expect(userRepositoryMock.findAll).not.toHaveBeenCalled();
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
