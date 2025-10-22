import { SessionType } from '@/shared/domain/enums';

/**
 * Datos necesarios para crear una nueva sesión.
 *
 * @public
 */
export type CreateSessionData = {
  /** ID del usuario propietario de la sesión */
  userId: string;
  /** Hash del refresh token (SHA-256) */
  refreshTokenHash: string;
  /** Tipo de sesión (WEB, MOBILE, API) */
  type: SessionType;
  /** Fecha de expiración del refresh token */
  expiresAt: Date;
  /** User agent del cliente (opcional) */
  userAgent?: string;
  /** Dirección IP del cliente (opcional) */
  ipAddress?: string;
};

/**
 * Resultado de la operación de refresh token.
 *
 * Incluye el nuevo access token y el nuevo refresh token con metadata temporal.
 *
 * @public
 */
export type RefreshTokenResult = {
  /** Nuevo access token JWT */
  accessToken: string;
  /** Nuevo refresh token opaco */
  refreshToken: string;
  /** Fecha en que se creó el access token */
  createdAt: Date;
  /** Fecha en que expira el access token */
  expiredAt: Date;
};

/**
 * Contexto de la solicitud para operaciones de refresh token.
 *
 * @public
 */
export type RefreshTokenContext = {
  /** User agent del cliente */
  userAgent?: string;
  /** Dirección IP del cliente */
  ipAddress?: string;
  /** Tipo de sesión */
  type: SessionType;
};
