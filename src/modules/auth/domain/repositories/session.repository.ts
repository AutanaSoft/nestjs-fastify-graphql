import { DomainBaseError } from '@/shared/domain/errors';
import { SessionEntity } from '../entities';
import type { CreateSessionData } from '../types';

/**
 * Puerto (interfaz) del repositorio de sesiones.
 *
 * Define el contrato para las operaciones de persistencia de sesiones de usuario.
 * Implementa el patrón Repository del dominio para gestionar sesiones con refresh
 * tokens, rotación automática y revocación de sesiones comprometidas.
 *
 * Las implementaciones concretas (adapters) en la capa de infraestructura deben
 * implementar esta interfaz utilizando TypeORM u otro mecanismo de persistencia.
 *
 * @remarks
 * Este repositorio maneja:
 * - Creación de sesiones con refresh tokens hasheados
 * - Búsqueda por token hash para validación
 * - Revocación individual y masiva de sesiones
 * - Actualización de última actividad
 * - Limpieza de sesiones expiradas
 * - Conteo de sesiones activas por usuario
 *
 * @public
 */
export abstract class SessionRepository {
  /**
   * Crea una nueva sesión en la base de datos.
   *
   * Almacena una sesión con el hash SHA-256 del refresh token, información
   * del dispositivo y fechas de expiración. No almacena el token en texto plano.
   *
   * @param data Datos para crear la sesión incluyendo userId, refreshTokenHash,
   *             expiresAt, type, ipAddress y userAgent
   * @returns Sesión creada con todos sus campos o error de dominio si falla
   * @throws {DomainBaseError} Si ocurre un error en la capa de persistencia
   *
   * @remarks
   * El refreshTokenHash debe ser un hash SHA-256 del token original.
   * La sesión se crea en estado activo (revokedAt = null).
   */
  abstract create(data: CreateSessionData): Promise<SessionEntity | DomainBaseError>;

  /**
   * Busca una sesión por el hash del refresh token.
   *
   * Utilizado durante la rotación de refresh tokens para validar que el token
   * proporcionado corresponde a una sesión válida y no revocada.
   *
   * @param refreshTokenHash Hash SHA-256 del refresh token a buscar
   * @returns Sesión encontrada, null si no existe, o error de dominio si falla
   * @throws {DomainBaseError} Si ocurre un error en la capa de persistencia
   *
   * @remarks
   * Este método es crítico para detectar reutilización de tokens.
   * Si se encuentra una sesión revocada, indica intento de compromiso.
   */
  abstract findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<SessionEntity | null | DomainBaseError>;

  /**
   * Busca una sesión por su ID único.
   *
   * Utilizado para recuperar información de sesión cuando se tiene el ID
   * de sesión (por ejemplo, desde el payload de un access token).
   *
   * @param sessionId ID único de la sesión (UUID)
   * @returns Sesión encontrada, null si no existe, o error de dominio si falla
   * @throws {DomainBaseError} Si ocurre un error en la capa de persistencia
   */
  abstract findById(sessionId: string): Promise<SessionEntity | null | DomainBaseError>;

  /**
   * Revoca una sesión específica.
   *
   * Marca la sesión como revocada estableciendo la fecha de revocación.
   * Una sesión revocada no puede utilizarse para obtener nuevos access tokens.
   *
   * @param sessionId ID de la sesión a revocar
   * @returns Sesión revocada con revokedAt actualizado, o error de dominio si falla
   * @throws {DomainBaseError} Si ocurre un error en la capa de persistencia
   *
   * @remarks
   * Utilizado durante logout o cuando se detecta reuso de refresh token.
   * La sesión permanece en la base de datos para auditoría.
   */
  abstract revokeSession(sessionId: string): Promise<SessionEntity | DomainBaseError>;

  /**
   * Revoca todas las sesiones activas de un usuario.
   *
   * Marca como revocadas todas las sesiones no expiradas de un usuario,
   * opcionalmente filtradas por tipo (WEB, MOBILE, API).
   *
   * @param userId ID del usuario cuyas sesiones se revocarán
   * @param type Tipo de sesión a revocar (opcional). Si se omite, revoca todas
   * @returns Número de sesiones revocadas, o error de dominio si falla
   * @throws {DomainBaseError} Si ocurre un error en la capa de persistencia
   *
   * @remarks
   * Útil cuando se detecta compromiso de cuenta o reuso de token.
   * Fuerza al usuario a re-autenticarse en todos los dispositivos afectados.
   */
  abstract revokeAllUserSessions(userId: string, type?: string): Promise<number | DomainBaseError>;

  /**
   * Actualiza la fecha de último uso de una sesión.
   *
   * Registra la última vez que se utilizó un refresh token para obtener
   * un nuevo access token. Útil para detectar sesiones inactivas.
   *
   * @param sessionId ID de la sesión a actualizar
   * @returns Sesión actualizada con lastUsedAt modificado, o error de dominio si falla
   * @throws {DomainBaseError} Si ocurre un error en la capa de persistencia
   *
   * @remarks
   * Se actualiza cada vez que se rota el refresh token exitosamente.
   * Permite implementar políticas de expiración por inactividad.
   */
  abstract updateLastUsedAt(sessionId: string): Promise<SessionEntity | DomainBaseError>;

  /**
   * Elimina sesiones expiradas de la base de datos.
   *
   * Realiza limpieza periódica de sesiones cuya fecha de expiración (expiresAt)
   * ya pasó. Reduce el tamaño de la tabla y mejora el rendimiento.
   *
   * @returns Número de sesiones eliminadas, o error de dominio si falla
   * @throws {DomainBaseError} Si ocurre un error en la capa de persistencia
   *
   * @remarks
   * Debe ejecutarse periódicamente (ej: mediante un cron job).
   * Solo elimina sesiones expiradas, no revocadas que aún no expiraron.
   */
  abstract cleanExpiredSessions(): Promise<number | DomainBaseError>;

  /**
   * Cuenta el número de sesiones activas de un usuario.
   *
   * Cuenta sesiones que no están revocadas ni expiradas para un usuario específico.
   * Útil para implementar límites de sesiones concurrentes.
   *
   * @param userId ID del usuario cuyas sesiones activas se contarán
   * @returns Número de sesiones activas, o error de dominio si falla
   * @throws {DomainBaseError} Si ocurre un error en la capa de persistencia
   *
   * @remarks
   * Una sesión activa es aquella donde:
   * - revokedAt es null
   * - expiresAt es mayor a la fecha actual
   */
  abstract countActiveSessions(userId: string): Promise<number | DomainBaseError>;
}

/**
 * Token de inyección de dependencias para el repositorio de sesiones.
 *
 * @remarks
 * Utilice este símbolo para inyectar implementaciones del {@link SessionRepository}
 * en constructores de casos de uso o servicios de aplicación.
 */
export const SESSION_REPOSITORY = Symbol('SessionRepository');
