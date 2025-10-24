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

/**
 * Representa un usuario de Prisma con sus permisos cargados mediante relaciones anidadas.
 *
 * @remarks
 * Este tipo se utiliza para garantizar la disponibilidad de permisos cuando se mapean
 * usuarios a entidades de dominio. Incluye la relación `permissions` con `permission` anidado.
 *
 * @internal
 */
type UserWithPermissions = User & {
  permissions: (UserPermission & {
    permission: Permission;
  })[];
};

@Injectable()
/**
 * Implementa el repositorio de usuarios utilizando Prisma ORM como adaptador de persistencia.
 *
 * @remarks
 * Este adaptador maneja la capa de persistencia para usuarios con las siguientes características:
 * - Cifrado de emails usando `CryptoService` (almacenados cifrados en BD)
 * - Hash de emails para búsquedas eficientes (campo `emailHash`)
 * - Gestión automática de permisos según el rol del usuario
 * - Transacciones para operaciones que requieren consistencia
 * - Mapeo bidireccional entre entidades Prisma y entidades de dominio
 * - Manejo robusto de errores con mensajes personalizados mediante `HandlerOrmErrorsService`
 *
 * **Flujo de creación de usuario**:
 * 1. Cifra el email y genera su hash
 * 2. Crea el usuario en una transacción
 * 3. Obtiene permisos por defecto del rol
 * 4. Busca los IDs de los permisos en BD
 * 5. Crea las relaciones UserPermission
 * 6. Retorna el usuario completo con permisos
 *
 * **Seguridad**:
 * - Los emails se almacenan cifrados (no reversible sin clave)
 * - El hash de email permite búsquedas sin descifrar
 * - Los logs ocultan información sensible (email, password)
 *
 * @public
 * @see UserRepository - Interfaz de dominio implementada
 * @see UserEntity - Entidad de dominio retornada
 * @see HandlerOrmErrorsService - Servicio para mapeo de errores Prisma
 */
export class UserPrismaAdapter implements UserRepository {
  constructor(
    @InjectPinoLogger(UserPrismaAdapter.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly handlerOrmErrorsService: HandlerOrmErrorsService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Crea un usuario en la base de datos con asignación automática de permisos según su rol.
   *
   * @param user - Datos de creación del usuario con email en texto plano y password hasheado
   * @returns Promesa con la entidad de usuario creada incluyendo permisos, o error de dominio
   *
   * @throws DomainBaseError con código UNIQUE_CONSTRAINT_VIOLATION cuando ya existe un usuario con el mismo email o userName
   * @throws DomainBaseError con código DATABASE_ERROR para otros errores de persistencia
   *
   * @remarks
   * **Proceso de creación**:
   * 1. Cifra el email usando `CryptoService.encrypt()` para almacenamiento seguro
   * 2. Genera hash del email con `CryptoService.hash()` para búsquedas eficientes
   * 3. Crea el usuario en una transacción de Prisma
   * 4. Obtiene permisos por defecto del rol mediante `UserPermissionService.getDefaultPermissionsForRole()`
   * 5. Busca los IDs de permisos en la tabla `permission`
   * 6. Crea las relaciones en `UserPermission` (tabla intermedia)
   * 7. Retorna el usuario completo con permisos cargados
   *
   * **Transacción**: Se usa `$transaction` para garantizar atomicidad:
   * - Si falla la creación de permisos, se revierte la creación del usuario
   * - Evita usuarios sin permisos o estados inconsistentes
   *
   * **Seguridad**:
   * - Email almacenado cifrado (columna `email`)
   * - Hash de email para búsquedas (columna `emailHash`)
   * - Logs ocultan información sensible
   *
   * @example
   * ```typescript
   * const result = await userPrismaAdapter.create({
   *   email: 'john@example.com',
   *   userName: 'johndoe',
   *   password: '$2b$10$hashedPassword...',
   *   role: UserRole.USER,
   *   status: UserStatus.ACTIVE
   * });
   *
   * if (result instanceof DomainBaseError) {
   *   throw result; // Manejar error
   * }
   *
   * console.log(result.permissions); // ['user:read:own', 'user:update:own']
   * ```
   */
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

  /**
   * Actualiza los datos de un usuario existente identificado por su ID.
   *
   * @param params - Parámetros de actualización con ID del usuario y datos parciales a modificar
   * @param params.id - Identificador único del usuario a actualizar
   * @param params.data - Objeto con los campos a actualizar (todos opcionales)
   * @returns Promesa con la entidad de usuario actualizada sin permisos, o error de dominio
   *
   * @throws DomainBaseError con código UNIQUE_CONSTRAINT_VIOLATION cuando el nuevo email o userName ya están en uso
   * @throws DomainBaseError con código RECORD_NOT_FOUND cuando no existe un usuario con el ID especificado
   * @throws DomainBaseError con código DATABASE_ERROR para otros errores de persistencia
   *
   * @remarks
   * **Campos actualizables**:
   * - `email`: Se cifra y se regenera el hash automáticamente
   * - `userName`: Se actualiza directamente
   * - `password`: Se actualiza directamente (debe venir hasheado)
   * - `status`: Cambio de estado del usuario (ACTIVE, INACTIVE, BANNED)
   * - `role`: Cambio de rol (no actualiza permisos automáticamente)
   *
   * **Importante**: Este método NO actualiza los permisos del usuario. Si se cambia el rol,
   * los permisos deben actualizarse por separado mediante un método específico.
   *
   * **Cifrado de email**: Si se actualiza el email, se regenera automáticamente:
   * - `email`: Email cifrado
   * - `emailHash`: Hash para búsquedas
   *
   * **Optimización**: La entidad retornada no incluye permisos (array vacío) ya que
   * las operaciones de actualización típicamente no los requieren. Use `findById()`
   * para obtener el usuario completo con permisos.
   *
   * @example
   * ```typescript
   * const result = await userPrismaAdapter.update({
   *   id: '123e4567-e89b-12d3-a456-426614174000',
   *   data: {
   *     userName: 'newusername',
   *     status: UserStatus.INACTIVE
   *   }
   * });
   *
   * if (result instanceof DomainBaseError) {
   *   throw result; // Manejar error
   * }
   *
   * console.log(result.userName); // 'newusername'
   * console.log(result.permissions); // [] (vacío)
   * ```
   */
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

  /**
   * Recupera un usuario a partir de su identificador único (UUID).
   *
   * @param id - Identificador UUID del usuario
   * @returns Promesa con la entidad de usuario incluyendo permisos, null si no existe, o error de dominio
   *
   * @throws DomainBaseError con código DATABASE_ERROR cuando ocurre un fallo al consultar datos
   *
   * @remarks
   * **Incluye permisos**: Este método carga la relación completa de permisos mediante:
   * - `include.permissions.include.permission`: Carga UserPermission con Permission anidado
   * - Retorna array de strings con nombres de permisos (optimizado para JWT)
   *
   * **Email descifrado**: El email se descifra automáticamente antes de retornar la entidad.
   *
   * **Caso null**: Retorna `null` cuando no existe un usuario con el ID especificado.
   * Esto NO es un error, es un caso válido que el llamador debe manejar.
   *
   * @example
   * ```typescript
   * const result = await userPrismaAdapter.findById('123e4567-e89b-12d3-a456-426614174000');
   *
   * if (result instanceof DomainBaseError) {
   *   throw result; // Error de BD
   * }
   *
   * if (result === null) {
   *   throw createUserNotFoundError(id); // Usuario no existe
   * }
   *
   * console.log(result.email); // 'john@example.com' (descifrado)
   * console.log(result.permissions); // ['user:read:own', 'user:update:own']
   * ```
   */
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

  /**
   * Recupera un usuario a partir de su correo electrónico (email en texto plano).
   *
   * @param email - Correo electrónico del usuario en texto plano (no cifrado)
   * @returns Promesa con la entidad de usuario incluyendo permisos, null si no existe, o error de dominio
   *
   * @throws DomainBaseError con código DATABASE_ERROR cuando ocurre un fallo al consultar datos
   *
   * @remarks
   * **Búsqueda por hash**: Aunque el email se pasa en texto plano, la búsqueda se realiza mediante:
   * 1. Se genera el hash del email con `CryptoService.hash(email)`
   * 2. Se busca en BD usando el campo `emailHash` (indexado para performance)
   * 3. No se descifra ningún email de BD, se usa el hash para comparación
   *
   * **¿Por qué usar hash en lugar de descifrar?**
   * - **Performance**: El hash es más rápido que descifrar todos los emails
   * - **Seguridad**: Evita exponer la clave de cifrado en cada búsqueda
   * - **Escalabilidad**: El índice en `emailHash` permite búsquedas O(1)
   *
   * **Incluye permisos**: Carga la relación completa de permisos del usuario.
   *
   * **Email descifrado**: El email del usuario retornado está descifrado (texto plano).
   *
   * **Caso null**: Retorna `null` cuando no existe un usuario con ese email.
   * Esto NO es un error, es un caso válido para validar credenciales o verificar duplicados.
   *
   * @example
   * ```typescript
   * // Caso 1: Verificar si existe antes de crear
   * const existing = await userPrismaAdapter.findByEmail('john@example.com');
   *
   * if (existing instanceof DomainBaseError) {
   *   throw existing; // Error de BD
   * }
   *
   * if (existing !== null) {
   *   throw createUserAlreadyExistsError('email', 'john@example.com');
   * }
   *
   * // Caso 2: Login (buscar usuario por email)
   * const user = await userPrismaAdapter.findByEmail(credentials.email);
   *
   * if (user === null) {
   *   throw createInvalidCredentialsError(credentials.email);
   * }
   *
   * console.log(user.email); // 'john@example.com' (descifrado)
   * console.log(user.permissions); // ['user:read:own', ...]
   * ```
   */
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

  /**
   * Recupera todos los usuarios registrados en la base de datos ordenados por fecha de creación.
   *
   * @returns Promesa con el array de entidades de usuarios incluyendo permisos, o error de dominio
   *
   * @throws DomainBaseError con código DATABASE_ERROR cuando ocurre un fallo al consultar datos
   *
   * @remarks
   * **Orden**: Los usuarios se retornan ordenados por `createdAt DESC` (más recientes primero).
   *
   * **Incluye permisos**: Cada usuario incluye su array completo de permisos.
   *
   * **Emails descifrados**: Todos los emails se descifran automáticamente.
   *
   * **Performance**: Este método puede ser costoso con grandes volúmenes de datos.
   * Considere usar paginación para aplicaciones en producción.
   *
   * **Caso array vacío**: Retorna `[]` cuando no hay usuarios en la BD.
   * Esto NO es un error.
   *
   * @example
   * ```typescript
   * const result = await userPrismaAdapter.findAll();
   *
   * if (result instanceof DomainBaseError) {
   *   throw result; // Error de BD
   * }
   *
   * if (result.length === 0) {
   *   console.log('No users found');
   * }
   *
   * result.forEach(user => {
   *   console.log(user.email); // Email descifrado
   *   console.log(user.permissions); // Array de permisos
   * });
   * ```
   *
   * @todo Implementar paginación (skip/take) para optimizar consultas grandes
   */
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

  /**
   * Mapea un registro de Prisma con permisos a una entidad de dominio.
   *
   * @param user - Registro de usuario de Prisma con relación `permissions` cargada
   * @returns Entidad de dominio UserEntity con email descifrado y permisos como array de strings
   *
   * @remarks
   * **Transformaciones aplicadas**:
   * 1. **Email descifrado**: `user.email` (cifrado) → descifrado con `CryptoService.decrypt()`
   * 2. **Permisos optimizados**: `UserPermission[]` → `string[]` con solo nombres
   *    - De: `[{ permission: { id, name, description } }]`
   *    - A: `['user:read:own', 'user:update:own']`
   *
   * **Optimización de permisos**: Se extraen solo los nombres para:
   * - Reducir tamaño del JWT (si se incluyen en el token)
   * - Simplificar verificaciones en guards/decorators
   * - Evitar exponer información innecesaria (id, description)
   *
   * **Seguridad**: El email cifrado en BD nunca se expone, siempre se descifra
   * antes de crear la entidad de dominio.
   *
   * @private
   *
   * @example
   * ```typescript
   * // Input (Prisma)
   * const prismaUser = {
   *   id: '123',
   *   email: 'encrypted_base64_string',
   *   emailHash: 'sha256_hash',
   *   permissions: [
   *     { permission: { id: '1', name: 'user:read:own', description: '...' } },
   *     { permission: { id: '2', name: 'user:update:own', description: '...' } }
   *   ]
   * };
   *
   * // Output (Domain)
   * const domainUser = this.mapToDomain(prismaUser);
   * // {
   * //   id: '123',
   * //   email: 'john@example.com', // descifrado
   * //   permissions: ['user:read:own', 'user:update:own'] // optimizado
   * // }
   * ```
   */
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

  /**
   * Mapea un registro de Prisma sin permisos a una entidad de dominio con array de permisos vacío.
   *
   * @param user - Registro de usuario de Prisma sin relación `permissions` cargada
   * @returns Entidad de dominio UserEntity con email descifrado y permisos vacíos
   *
   * @remarks
   * **Uso específico**: Este método se utiliza exclusivamente en operaciones `update()`
   * donde los permisos no se modifican ni se necesitan retornar.
   *
   * **Optimización**: Evita cargar la relación `permissions` en updates simples:
   * - Reduce queries a BD (no hace JOIN con UserPermission/Permission)
   * - Acelera operaciones que solo actualizan datos básicos
   * - Retorna entidad válida pero sin permisos cargados
   *
   * **Limitación**: La entidad retornada tiene `permissions: []` vacío.
   * Si necesitas permisos después de actualizar, llama a `findById()`.
   *
   * **Email descifrado**: Al igual que `mapToDomain()`, descifra el email.
   *
   * @private
   *
   * @example
   * ```typescript
   * // En el método update()
   * const updated = await this.prisma.user.update({
   *   where: { id },
   *   data: updateData,
   *   // NO incluye: include: { permissions: { include: { permission: true } } }
   * });
   *
   * // Mapear sin permisos (más rápido)
   * return this.mapToDomainWithoutPermissions(updated);
   * // { id: '123', email: 'john@example.com', permissions: [] }
   *
   * // Si necesitas permisos después:
   * const userWithPermissions = await this.findById(updated.id);
   * ```
   */
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
