import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';

/**
 * Crea un error cuando el usuario solicitado no existe en el sistema.
 *
 * @param id - ID del usuario
 * @returns Error de dominio con código USER_NOT_FOUND y estado 404
 */
export const createUserNotFoundError = (id: string): DomainBaseError =>
  ErrorFactory.createNotFoundError({
    code: 'USER_NOT_FOUND',
    message: `User not found with id: ${id}`,
  });

/**
 * Crea un error cuando no se encuentra un usuario por su email.
 *
 * @param email - Email del usuario
 * @returns Error de dominio con código USER_NOT_FOUND y estado 404
 */
export const createUserNotFoundByEmailError = (email: string): DomainBaseError =>
  ErrorFactory.createNotFoundError({
    code: 'USER_NOT_FOUND',
    message: `User not found with email: ${email}`,
  });

/**
 * Crea un error cuando se intenta crear un usuario con un campo único que ya existe.
 *
 * @param field - Campo duplicado (email, username, etc.)
 * @param value - Valor duplicado
 * @returns Error de dominio con código USER_ALREADY_EXISTS y estado 409
 */
export const createUserAlreadyExistsError = (field: string, value: string): DomainBaseError =>
  ErrorFactory.createConflictError({
    code: 'USER_ALREADY_EXISTS',
    message: `User with ${field} '${value}' already exists`,
  });

/**
 * Crea un error cuando se intenta verificar un email que ya está verificado.
 *
 * @returns Error de dominio con código EMAIL_ALREADY_VERIFIED y estado 409
 */
export const createEmailAlreadyVerifiedError = (): DomainBaseError =>
  ErrorFactory.createConflictError({
    code: 'EMAIL_ALREADY_VERIFIED',
    message: 'Email is already verified',
  });

/**
 * Crea un error cuando las credenciales proporcionadas no son válidas.
 *
 * @param message - Mensaje de error personalizado
 * @returns Error de dominio con código INVALID_CREDENTIALS y estado 401
 */
export const createInvalidCredentialsError = (
  message: string = 'Invalid email or password',
): DomainBaseError =>
  ErrorFactory.createUnauthorizedError({
    code: 'INVALID_CREDENTIALS',
    message,
  });

/**
 * Crea un error cuando falla la validación de datos del usuario.
 *
 * @param fields - Array de campos con errores de validación
 * @returns Error de dominio con código USER_VALIDATION_ERROR y estado 400
 */
export const createUserValidationError = (
  fields: Array<{ field: string; message: string; value?: any }>,
): DomainBaseError => {
  const fieldNames = fields.map((f) => f.field).join(', ');
  return ErrorFactory.createBadRequestError({
    code: 'USER_VALIDATION_ERROR',
    message: `User validation failed for fields: ${fieldNames}`,
  });
};

/**
 * Crea un error cuando se intenta usar un nombre de usuario prohibido.
 *
 * @param userName - Nombre de usuario que está prohibido
 * @returns Error de dominio con código FORBIDDEN_USERNAME y estado 403
 */
export const createForbiddenUserNameError = (userName: string): DomainBaseError =>
  ErrorFactory.createForbiddenError({
    code: 'FORBIDDEN_USERNAME',
    message: `The username "${userName}" is not allowed`,
  });

/**
 * Crea un error cuando se intenta registrar con un dominio de email prohibido.
 *
 * @param email - Email completo que fue rechazado
 * @param domain - Dominio del email que está prohibido
 * @returns Error de dominio con código FORBIDDEN_EMAIL_DOMAIN y estado 403
 */
export const createForbiddenEmailDomainError = (email: string, domain: string): DomainBaseError =>
  ErrorFactory.createForbiddenError({
    code: 'FORBIDDEN_EMAIL_DOMAIN',
    message: `The email domain "${domain}" from "${email}" is not allowed`,
  });

/**
 * Crea un error cuando falla la actualización de un usuario.
 *
 * @returns Error de dominio con código USER_UPDATE_FAILED y estado 500
 */
export const createUserUpdateFailedError = (): DomainBaseError =>
  ErrorFactory.createInternalServerError('USER_UPDATE_FAILED');

/**
 * Crea un error cuando falla la creación de un usuario.
 *
 * @param message - Mensaje descriptivo del error de creación
 * @returns Error de dominio con código USER_CREATION_ERROR y estado 400
 */
export const createUserCreationError = (message: string): DomainBaseError =>
  ErrorFactory.createBadRequestError({
    code: 'USER_CREATION_ERROR',
    message: message || 'User creation failed',
  });
