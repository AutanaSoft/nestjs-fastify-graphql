import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';

/**
 * Crea un error de credenciales inválidas para autenticación fallida.
 *
 * @param message - Mensaje de error personalizado
 * @returns Error de dominio con código INVALID_CREDENTIALS y estado 401
 */
export const createInvalidCredentialsError = (
  message: string = 'Invalid email or password',
): DomainBaseError =>
  ErrorFactory.createUnauthorizedError({ code: 'INVALID_CREDENTIALS', message });

/**
 * Crea un error cuando la cuenta del usuario no ha sido verificada por email.
 *
 * @returns Error de dominio con código ACCOUNT_NOT_VERIFIED y estado 403
 */
export const createAccountNotVerifiedError = (): DomainBaseError =>
  ErrorFactory.createForbiddenError({
    code: 'ACCOUNT_NOT_VERIFIED',
    message: 'Account email is not verified. Please check your email and verify your account.',
  });

/**
 * Crea un error cuando la cuenta del usuario está suspendida o bloqueada.
 *
 * @param accountStatus - Estado actual de la cuenta (ej: 'suspended', 'blocked')
 * @returns Error de dominio con código ACCOUNT_SUSPENDED y estado 403
 */
export const createAccountSuspendedError = (accountStatus: string): DomainBaseError =>
  ErrorFactory.createForbiddenError({
    code: 'ACCOUNT_SUSPENDED',
    message: `Account is ${accountStatus.toLowerCase()}. Please contact support.`,
  });

/**
 * Crea un error cuando el refresh token proporcionado no es válido.
 *
 * @param message - Mensaje de error personalizado
 * @returns Error de dominio con código INVALID_REFRESH_TOKEN y estado 401
 */
export const createInvalidRefreshTokenError = (
  message: string = 'Invalid refresh token',
): DomainBaseError =>
  ErrorFactory.createUnauthorizedError({
    code: 'INVALID_REFRESH_TOKEN',
    message,
  });

/**
 * Crea un error cuando el refresh token ha expirado.
 *
 * @param message - Mensaje de error personalizado
 * @returns Error de dominio con código EXPIRED_REFRESH_TOKEN y estado 401
 */
export const createExpiredRefreshTokenError = (
  message: string = 'Refresh token has expired',
): DomainBaseError =>
  ErrorFactory.createUnauthorizedError({
    code: 'EXPIRED_REFRESH_TOKEN',
    message,
  });

/**
 * Crea un error cuando el refresh token ha sido revocado por razones de seguridad.
 *
 * @param message - Mensaje de error personalizado
 * @returns Error de dominio con código REVOKED_REFRESH_TOKEN y estado 401
 */
export const createRevokedRefreshTokenError = (
  message: string = 'Refresh token has been revoked. All sessions have been terminated for security reasons.',
): DomainBaseError =>
  ErrorFactory.createUnauthorizedError({
    code: 'REVOKED_REFRESH_TOKEN',
    message,
  });

/**
 * Crea un error cuando no se encuentra la sesión solicitada.
 *
 * @param sessionId - ID de la sesión no encontrada
 * @returns Error de dominio con código SESSION_NOT_FOUND y estado 404
 */
export const createSessionNotFoundError = (sessionId: string): DomainBaseError =>
  ErrorFactory.createNotFoundError({
    code: 'SESSION_NOT_FOUND',
    message: `Session with id ${sessionId} not found`,
  });
