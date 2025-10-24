/**
 * Helpers para crear errores específicos del módulo de usuarios usando ErrorFactory.
 *
 * @remarks
 * Este archivo demuestra el nuevo enfoque simplificado usando métodos genéricos
 * del ErrorFactory basados en HTTP status. Los helpers solo componen el mensaje
 * y pasan el código, mensaje y contexto apropiados.
 *
 * **Ventajas**:
 * - Helpers mínimos (1-2 líneas)
 * - Sin duplicación de status codes
 * - Type-safe
 * - Fácil de testear
 *
 * @example
 * ```typescript
 * // En use cases
 * import { createUserNotFoundError, createUserAlreadyExistsError } from './user-error.helpers';
 *
 * throw createUserNotFoundError('123');
 * throw createUserAlreadyExistsError('email', 'john@example.com');
 * ```
 */

import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';

/**
 * Crea un error de usuario no encontrado (404).
 *
 * @param id - ID del usuario
 * @returns Error de dominio NOT_FOUND con contexto del usuario
 *
 * @example
 * ```typescript
 * throw createUserNotFoundError('123');
 * // USER_NOT_FOUND: User not found with id: 123
 * ```
 */
export const createUserNotFoundError = (id: string): DomainBaseError =>
  ErrorFactory.createNotFoundError('USER_NOT_FOUND', `User not found with id: ${id}`, {
    userId: id,
  });

/**
 * Crea un error de usuario no encontrado por email (404).
 *
 * @param email - Email del usuario
 * @returns Error de dominio NOT_FOUND con contexto del email
 *
 * @example
 * ```typescript
 * throw createUserNotFoundByEmailError('john@example.com');
 * // USER_NOT_FOUND: User not found with email: john@example.com
 * ```
 */
export const createUserNotFoundByEmailError = (email: string): DomainBaseError =>
  ErrorFactory.createNotFoundError('USER_NOT_FOUND', `User not found with email: ${email}`, {
    email,
  });

/**
 * Crea un error de usuario ya existente (409).
 *
 * @param field - Campo duplicado (email, username, etc.)
 * @param value - Valor duplicado
 * @returns Error de dominio CONFLICT con contexto del campo duplicado
 *
 * @example
 * ```typescript
 * throw createUserAlreadyExistsError('email', 'john@example.com');
 * // USER_ALREADY_EXISTS: User with email 'john@example.com' already exists
 * ```
 */
export const createUserAlreadyExistsError = (field: string, value: string): DomainBaseError =>
  ErrorFactory.createConflictError(
    'USER_ALREADY_EXISTS',
    `User with ${field} '${value}' already exists`,
    { field, value },
  );

/**
 * Crea un error de email ya verificado (409).
 *
 * @param userId - ID del usuario
 * @returns Error de dominio CONFLICT indicando que el email ya está verificado
 *
 * @example
 * ```typescript
 * throw createEmailAlreadyVerifiedError('123');
 * // EMAIL_ALREADY_VERIFIED: Email is already verified
 * ```
 */
export const createEmailAlreadyVerifiedError = (userId: string): DomainBaseError =>
  ErrorFactory.createConflictError('EMAIL_ALREADY_VERIFIED', 'Email is already verified', {
    userId,
    emailVerified: true,
  });

/**
 * Crea un error de credenciales inválidas (401).
 *
 * @param email - Email provisto en el intento de login
 * @returns Error de dominio UNAUTHORIZED para credenciales inválidas
 *
 * @example
 * ```typescript
 * throw createInvalidCredentialsError('john@example.com');
 * // INVALID_CREDENTIALS: Invalid email or password
 * ```
 */
export const createInvalidCredentialsError = (email: string): DomainBaseError =>
  ErrorFactory.createUnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password', {
    email,
  });

/**
 * Crea un error de validación de datos de usuario (400).
 *
 * @param fields - Array de campos con errores de validación
 * @returns Error de dominio BAD_REQUEST con detalles de validación
 *
 * @example
 * ```typescript
 * throw createUserValidationError([
 *   { field: 'email', message: 'Invalid email format', value: 'invalid-email' },
 *   { field: 'password', message: 'Password too weak', value: '123' }
 * ]);
 * ```
 */
export const createUserValidationError = (
  fields: Array<{ field: string; message: string; value?: any }>,
): DomainBaseError => {
  const fieldNames = fields.map((f) => f.field).join(', ');
  return ErrorFactory.createBadRequestError(
    'USER_VALIDATION_ERROR',
    `User validation failed for fields: ${fieldNames}`,
    { fields, failedCount: fields.length },
  );
};

/**
 * Crea un error de nombre de usuario prohibido (403).
 *
 * @param userName - Nombre de usuario que está prohibido
 * @returns Error de dominio FORBIDDEN indicando que el username no está permitido
 *
 * @example
 * ```typescript
 * throw createForbiddenUserNameError('admin');
 * // FORBIDDEN_USERNAME: The username "admin" is not allowed
 * ```
 */
export const createForbiddenUserNameError = (userName: string): DomainBaseError =>
  ErrorFactory.createForbiddenError(
    'FORBIDDEN_USERNAME',
    `The username "${userName}" is not allowed`,
    { userName },
  );

/**
 * Crea un error de dominio de email prohibido (403).
 *
 * @param email - Email completo que fue rechazado
 * @param domain - Dominio del email que está prohibido
 * @returns Error de dominio FORBIDDEN indicando que el dominio no está permitido
 *
 * @example
 * ```typescript
 * throw createForbiddenEmailDomainError('test@example.com', 'example.com');
 * // FORBIDDEN_EMAIL_DOMAIN: The email domain "example.com" from "test@example.com" is not allowed
 * ```
 */
export const createForbiddenEmailDomainError = (email: string, domain: string): DomainBaseError =>
  ErrorFactory.createForbiddenError(
    'FORBIDDEN_EMAIL_DOMAIN',
    `The email domain "${domain}" from "${email}" is not allowed`,
    { email, domain },
  );

/**
 * Crea un error de actualización de usuario fallida (500).
 *
 * @param userId - ID del usuario que no se pudo actualizar
 * @returns Error de dominio INTERNAL_SERVER_ERROR para fallos de actualización
 *
 * @example
 * ```typescript
 * throw createUserUpdateFailedError('123e4567-e89b-12d3-a456-426614174000');
 * // USER_UPDATE_FAILED: Failed to update user with ID "123e4567-e89b-12d3-a456-426614174000"
 * ```
 */
export const createUserUpdateFailedError = (userId: string): DomainBaseError =>
  ErrorFactory.createInternalServerError(
    'USER_UPDATE_FAILED',
    `Failed to update user with ID "${userId}"`,
    { userId },
  );

/**
 * Crea un error de creación de usuario (400).
 *
 * @param message - Mensaje descriptivo del error de creación/validación
 * @returns Error de dominio BAD_REQUEST para errores de creación
 *
 * @example
 * ```typescript
 * throw createUserCreationError('Password does not meet complexity requirements');
 * // USER_CREATION_ERROR: Password does not meet complexity requirements
 * ```
 */
export const createUserCreationError = (message: string): DomainBaseError =>
  ErrorFactory.createBadRequestError('USER_CREATION_ERROR', message || 'User creation failed', {});
