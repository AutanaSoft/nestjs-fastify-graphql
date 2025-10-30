import { ApiReturnError } from './domain-base.error';
import { ErrorFactory } from './error.factory';

/**
 * Crea un error específico para tokens JWT expirados.
 *
 * @param message - Mensaje personalizado de error. Por defecto: 'Token has expired'
 * @returns Error de tipo ApiReturnError con código TOKEN_EXPIRED y status 401
 */
export const createTokenExpiredError = (message?: string): ApiReturnError =>
  ErrorFactory.createUnauthorizedError({
    message: message || 'Token has expired',
    code: 'TOKEN_EXPIRED',
  });

/**
 * Crea un error específico para tokens JWT inválidos o malformados.
 *
 * @param message - Mensaje personalizado de error. Por defecto: 'Invalid token provided'
 * @returns Error de tipo ApiReturnError con código INVALID_TOKEN y status 401
 */
export const createInvalidTokenError = (message?: string): ApiReturnError =>
  ErrorFactory.createUnauthorizedError({
    message: message || 'Invalid token provided',
    code: 'INVALID_TOKEN',
  });
