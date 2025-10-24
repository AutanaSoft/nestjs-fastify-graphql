/**
 * Helpers para crear errores específicos del módulo de autenticación usando ErrorFactory.
 *
 * @remarks
 * Este archivo proporciona funciones helper para crear errores relacionados con autenticación
 * de forma consistente usando los métodos genéricos del ErrorFactory basados en HTTP status.
 * Los helpers solo componen el mensaje y pasan el código, mensaje y contexto apropiados.
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
 * import { createInvalidCredentialsError, createAccountNotVerifiedError } from './auth-error.helpers';
 *
 * throw createInvalidCredentialsError();
 * throw createAccountNotVerifiedError('user@example.com');
 * ```
 */

import { DomainBaseError, ErrorFactory } from '@/shared/domain/errors';

/**
 * Crea un error de credenciales inválidas (401).
 *
 * @param message Mensaje personalizado (opcional)
 * @returns Error de dominio UNAUTHORIZED para credenciales inválidas
 *
 * @example
 * ```typescript
 * throw createInvalidCredentialsError();
 * // INVALID_CREDENTIALS: Invalid email or password
 * ```
 */
export const createInvalidCredentialsError = (
  message: string = 'Invalid email or password',
): DomainBaseError => ErrorFactory.createUnauthorizedError('INVALID_CREDENTIALS', message, {});

/**
 * Crea un error de cuenta no verificada (403).
 *
 * @param email Email de la cuenta que no está verificada
 * @returns Error de dominio FORBIDDEN indicando que el email debe ser verificado
 *
 * @example
 * ```typescript
 * throw createAccountNotVerifiedError('user@example.com');
 * // ACCOUNT_NOT_VERIFIED: Account email is not verified. Please check your email and verify your account.
 * ```
 */
export const createAccountNotVerifiedError = (email: string): DomainBaseError =>
  ErrorFactory.createForbiddenError(
    'ACCOUNT_NOT_VERIFIED',
    'Account email is not verified. Please check your email and verify your account.',
    { email },
  );

/**
 * Crea un error de cuenta suspendida o baneada (403).
 *
 * @param accountStatus Estado actual de la cuenta (SUSPENDED, BANNED, etc.)
 * @returns Error de dominio FORBIDDEN indicando que la cuenta está suspendida
 *
 * @example
 * ```typescript
 * throw createAccountSuspendedError('SUSPENDED');
 * // ACCOUNT_SUSPENDED: Account is suspended. Please contact support.
 * ```
 */
export const createAccountSuspendedError = (accountStatus: string): DomainBaseError =>
  ErrorFactory.createForbiddenError(
    'ACCOUNT_SUSPENDED',
    `Account is ${accountStatus.toLowerCase()}. Please contact support.`,
    { accountStatus },
  );

/**
 * Crea un error de refresh token inválido (401).
 *
 * @param message Mensaje personalizado (opcional)
 * @returns Error de dominio UNAUTHORIZED para refresh token inválido
 *
 * @example
 * ```typescript
 * throw createInvalidRefreshTokenError();
 * // INVALID_REFRESH_TOKEN: Invalid refresh token
 * ```
 */
export const createInvalidRefreshTokenError = (
  message: string = 'Invalid refresh token',
): DomainBaseError => ErrorFactory.createUnauthorizedError('INVALID_REFRESH_TOKEN', message, {});

/**
 * Crea un error de refresh token expirado (401).
 *
 * @param message Mensaje personalizado (opcional)
 * @returns Error de dominio UNAUTHORIZED para refresh token expirado
 *
 * @example
 * ```typescript
 * throw createExpiredRefreshTokenError();
 * // EXPIRED_REFRESH_TOKEN: Refresh token has expired
 * ```
 */
export const createExpiredRefreshTokenError = (
  message: string = 'Refresh token has expired',
): DomainBaseError => ErrorFactory.createUnauthorizedError('EXPIRED_REFRESH_TOKEN', message, {});

/**
 * Crea un error de refresh token revocado (401).
 *
 * Este error indica un posible intento de reuso de token, lo que puede
 * representar un riesgo de seguridad.
 *
 * @param message Mensaje personalizado (opcional)
 * @returns Error de dominio UNAUTHORIZED para refresh token revocado
 *
 * @example
 * ```typescript
 * throw createRevokedRefreshTokenError();
 * // REVOKED_REFRESH_TOKEN: Refresh token has been revoked. All sessions have been terminated for security reasons.
 * ```
 */
export const createRevokedRefreshTokenError = (
  message: string = 'Refresh token has been revoked. All sessions have been terminated for security reasons.',
): DomainBaseError => ErrorFactory.createUnauthorizedError('REVOKED_REFRESH_TOKEN', message, {});

/**
 * Crea un error de sesión no encontrada (404).
 *
 * @param sessionId ID de la sesión que no se encontró
 * @returns Error de dominio NOT_FOUND con contexto de la sesión
 *
 * @example
 * ```typescript
 * throw createSessionNotFoundError('123e4567-e89b-12d3-a456-426614174000');
 * // SESSION_NOT_FOUND: Session with id 123e4567-e89b-12d3-a456-426614174000 not found
 * ```
 */
export const createSessionNotFoundError = (sessionId: string): DomainBaseError =>
  ErrorFactory.createNotFoundError('SESSION_NOT_FOUND', `Session with id ${sessionId} not found`, {
    sessionId,
  });
