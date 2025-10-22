import { SessionEntity } from '../entities';
import type { CreateSessionData } from '../types';

/**
 * Puerto (interfaz) del repositorio de sesiones.
 *
 * Define el contrato para las operaciones de persistencia de sesiones.
 * Las implementaciones concretas (adapters) deben implementar esta interfaz.
 *
 * @public
 */
export abstract class SessionRepository {
  /**
   * Crea una nueva sesión en la base de datos.
   *
   * @param data Datos para crear la sesión
   * @returns Sesión creada
   */
  abstract create(data: CreateSessionData): Promise<SessionEntity>;

  /**
   * Busca una sesión por el hash del refresh token.
   *
   * @param refreshTokenHash Hash SHA-256 del refresh token
   * @returns Sesión encontrada o null si no existe
   */
  abstract findByRefreshTokenHash(refreshTokenHash: string): Promise<SessionEntity | null>;

  /**
   * Busca una sesión por su ID.
   *
   * @param sessionId ID de la sesión
   * @returns Sesión encontrada o null si no existe
   */
  abstract findById(sessionId: string): Promise<SessionEntity | null>;

  /**
   * Revoca una sesión específica.
   *
   * Marca la sesión como revocada y establece la fecha de revocación.
   *
   * @param sessionId ID de la sesión a revocar
   * @returns Sesión revocada
   */
  abstract revokeSession(sessionId: string): Promise<SessionEntity>;

  /**
   * Revoca todas las sesiones activas de un usuario para un tipo específico.
   *
   * Útil para revocar sesiones cuando se detecta reuso de token.
   *
   * @param userId ID del usuario
   * @param type Tipo de sesión (WEB, MOBILE, API)
   * @returns Número de sesiones revocadas
   */
  abstract revokeAllUserSessions(userId: string, type?: string): Promise<number>;

  /**
   * Actualiza la fecha de último uso de una sesión.
   *
   * @param sessionId ID de la sesión
   * @returns Sesión actualizada
   */
  abstract updateLastUsedAt(sessionId: string): Promise<SessionEntity>;

  /**
   * Elimina sesiones expiradas de la base de datos.
   *
   * Limpieza periódica de sesiones que ya no son válidas.
   *
   * @returns Número de sesiones eliminadas
   */
  abstract cleanExpiredSessions(): Promise<number>;

  /**
   * Cuenta el número de sesiones activas de un usuario.
   *
   * @param userId ID del usuario
   * @returns Número de sesiones activas
   */
  abstract countActiveSessions(userId: string): Promise<number>;
}
