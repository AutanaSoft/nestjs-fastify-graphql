import { Injectable } from '@nestjs/common';
import { Permission, Prisma, User, UserPermission } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { HandlerOrmErrorsService, PrismaService } from '@/shared/applications/services';
import { DomainBaseError } from '@/shared/domain/errors';
import { CryptoService } from '@/shared/infrastructure/services';
import { UserEntity } from '../../domain/entities';
import { UserRole } from '../../domain/enums';
import { UserRepository } from '../../domain/repository';
import { UserPermissionService } from '../../domain/services';
import { UserCreateType, UserUpdateType } from '../../domain/types';
import { USER_ORM_ERROR_CONFIG } from '../config/user-orm-errors.config';

type UserWithPermissions = User & {
  permissions: (UserPermission & {
    permission: Permission;
  })[];
};

@Injectable()
export class UserPrismaAdapter implements UserRepository {
  constructor(
    @InjectPinoLogger(UserPrismaAdapter.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly handlerOrmErrorsService: HandlerOrmErrorsService,
    private readonly cryptoService: CryptoService,
  ) {}

  async create(user: UserCreateType): Promise<UserEntity | DomainBaseError> {
    try {
      this.logger.info(
        { createUser: { ...user, email: '***', password: '***' } },
        'Creating new user with automatic role permissions...',
      );

      // Cifrar email y generar hash para búsqueda
      const encryptedEmail = this.cryptoService.encrypt(user.email);
      const emailHash = this.cryptoService.hash(user.email);

      // Mapeo de datos para Prisma
      const createData: Prisma.UserCreateInput = {
        email: encryptedEmail,
        emailHash: emailHash,
        userName: user.userName,
        password: user.password,
      };

      // Mapeo de enums si están definidos
      if (user.status) createData.status = user.status;
      if (user.role) createData.role = user.role;

      // Usar transacción para crear usuario y asignar permisos automáticamente
      const result = await this.prisma.$transaction(async (prisma) => {
        // Crear el usuario
        const created = await prisma.user.create({
          data: createData,
        });

        // Obtener permisos por defecto según el rol
        const rolePermissions = UserPermissionService.getDefaultPermissionsForRole(
          user.role || UserRole.USER,
        );

        // Buscar los IDs de los permisos en la base de datos
        const permissions = await prisma.permission.findMany({
          where: {
            name: {
              in: rolePermissions,
            },
          },
        });

        // Crear las relaciones UserPermission
        if (permissions.length > 0) {
          await prisma.userPermission.createMany({
            data: permissions.map((permission) => ({
              userId: created.id,
              permissionId: permission.id,
            })),
          });
        }

        // Retornar el usuario con permisos
        return await prisma.user.findUnique({
          where: { id: created.id },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });
      });

      if (!result) {
        throw new Error('Failed to create user with permissions');
      }

      this.logger.info(
        {
          createdUser: { ...result, email: '***', password: '***' },
          assignedPermissions: result.permissions.length,
        },
        'User created successfully with role permissions',
      );

      return this.mapToDomain(result);
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, USER_ORM_ERROR_CONFIG);
    }
  }

  async update(params: UserUpdateType): Promise<UserEntity | DomainBaseError> {
    try {
      this.logger.info({ updateUser: params.id }, 'Updating user...');
      const updateData: Prisma.UserUpdateInput = {};
      const { id, data: userData } = params;

      // Mapeo de datos a actualizar
      if (userData.email) {
        updateData.email = this.cryptoService.encrypt(userData.email);
        updateData.emailHash = this.cryptoService.hash(userData.email);
      }
      if (userData.userName) updateData.userName = userData.userName;
      if (userData.password) updateData.password = userData.password;
      if (userData.status) updateData.status = userData.status;
      if (userData.role) updateData.role = userData.role;

      // Actualización con Prisma
      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Mapeo a entidad de dominio
      this.logger.info(
        { updatedUser: { ...updated, email: '***', password: '***' } },
        'User updated successfully',
      );

      // Descifrar email antes de mapear a entidad de dominio
      return this.mapToDomainWithoutPermissions(updated);
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, USER_ORM_ERROR_CONFIG);
    }
  }

  async findById(id: string): Promise<UserEntity | null | DomainBaseError> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return user ? this.mapToDomain(user) : null;
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, USER_ORM_ERROR_CONFIG);
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null | DomainBaseError> {
    try {
      // Generar hash del email para búsqueda
      const emailHash = this.cryptoService.hash(email);

      const user = await this.prisma.user.findUnique({
        where: { emailHash },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return user ? this.mapToDomain(user) : null;
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, USER_ORM_ERROR_CONFIG);
    }
  }

  async findAll(): Promise<UserEntity[] | DomainBaseError> {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users.map((user) => this.mapToDomain(user));
    } catch (err) {
      return this.handlerOrmErrorsService.handleError(err, USER_ORM_ERROR_CONFIG);
    }
  }

  private mapToDomain(user: UserWithPermissions): UserEntity {
    // Descifrar el email antes de mapear a la entidad de dominio
    const decryptedEmail = this.cryptoService.decrypt(user.email);

    // Mapear permisos a nombres simples para optimizar JWT payload
    const permissions: string[] = user.permissions.map(
      (userPermission) => userPermission.permission.name,
    );

    return UserEntity.toDomain({
      ...user,
      email: decryptedEmail,
      permissions,
    });
  }

  private mapToDomainWithoutPermissions(user: User): UserEntity {
    // Descifrar el email antes de mapear a la entidad de dominio
    const decryptedEmail = this.cryptoService.decrypt(user.email);

    return UserEntity.toDomain({
      ...user,
      email: decryptedEmail,
      permissions: [], // Array vacío para operaciones create/update
    });
  }
}
