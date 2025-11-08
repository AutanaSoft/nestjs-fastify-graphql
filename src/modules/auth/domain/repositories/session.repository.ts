import { SessionEntity } from '../entities';
import type { CreateSessionData } from '../types';

/**
 * Puerto del repositorio de sesiones en la capa de dominio.
 *
 * Define el contrato para las operaciones de persistencia de sesiones de usuario,
 * implementando el patrón Repository para gestionar sesiones con refresh tokens,
 * rotación automática y revocación de sesiones comprometidas.
 *
 * @remarks
 * Responsabilidades:
 * - Crear sesiones con refresh tokens hasheados (SHA-256)
 * - Buscar sesiones por hash de token o ID
 * - Revocar sesiones individuales o todas las de un usuario
 * - Actualizar timestamp de última actividad
 * - Limpiar sesiones expiradas (mantenimiento)
 * - Contar sesiones activas por usuario (límite de concurrencia)
 *
 * Seguridad:
 * - Nunca almacena refresh tokens en texto plano
 * - Detecta reutilización de tokens mediante búsqueda de sesiones revocadas
 * - Permite revocación masiva ante compromiso de cuenta
 *
 * Las implementaciones concretas deben ubicarse en `infrastructure/adapters/`
 * y usar TypeORM u otro mecanismo de persistencia apropiado.
 *
 * @public
 */
export abstract class SessionRepository {
  /**
   * Crea una nueva sesión de usuario en la base de datos.
   *
   * @param data - Datos de la sesión: userId, refreshTokenHash (SHA-256), expiresAt,
   *               type, ipAddress y userAgent
   * @returns Entidad de sesión creada con estado activo
   *
   * @throws {DomainBaseError} Cuando falla la operación de persistencia
   *
   * @remarks
   * - El refreshTokenHash debe ser un hash SHA-256 del token original
   * - La sesión se crea activa (revokedAt = null)
   * - No almacenar nunca el refresh token en texto plano
   */
  abstract create(data: CreateSessionData): Promise<SessionEntity>;

  /**
   * Busca una sesión por el hash SHA-256 del refresh token.
   *
   * @param refreshTokenHash - Hash SHA-256 del refresh token a buscar
   * @returns Sesión encontrada, null si no existe
   *
   * @throws {DomainBaseError} Cuando falla la operación de búsqueda
   *
   * @remarks
   * Uso crítico en rotación de tokens:
   * - Si encuentra una sesión activa: rotación normal
   * - Si encuentra una sesión revocada: posible compromiso (reutilización de token)
   * - Si no encuentra sesión: token inválido o ya limpiado
   */
  abstract findByRefreshTokenHash(refreshTokenHash: string): Promise<SessionEntity | null>;

  /**
   * Busca una sesión por su identificador único.
   *
   * @param sessionId - ID único de la sesión (UUID)
   * @returns Sesión encontrada, null si no existe
   *
   * @throws {DomainBaseError} Cuando falla la operación de búsqueda
   *
   * @remarks
   * Útil para recuperar información de sesión desde el payload del access token,
   * que puede incluir el sessionId para rastreo y auditoría.
   */
  abstract findById(sessionId: string): Promise<SessionEntity | null>;

  /**
   * Revoca una sesión específica marcándola como no válida.
   *
   * @param sessionId - ID de la sesión a revocar
   * @returns Sesión revocada con revokedAt actualizado
   *
   * @throws {DomainBaseError} Cuando falla la operación de revocación
   *
   * @remarks
   * Casos de uso:
   * - Logout explícito del usuario
   * - Detección de reutilización de refresh token (compromiso)
   * - Revocación administrativa de sesión
   *
   * La sesión permanece en la BD para auditoría, solo se marca como revocada.
   */
  abstract revokeSession(sessionId: string): Promise<SessionEntity>;

  /**
   * Revoca todas las sesiones activas de un usuario.
   *
   * @param userId - ID del usuario cuyas sesiones se revocarán
   * @param type - Tipo de sesión a revocar (WEB, MOBILE, API). Si se omite, revoca todas
   * @returns Número de sesiones revocadas
   *
   * @throws {DomainBaseError} Cuando falla la operación de revocación masiva
   *
   * @remarks
   * Casos de uso críticos de seguridad:
   * - Detección de compromiso de cuenta (revocar todas las sesiones)
   * - Reutilización de refresh token (revocar todas las sesiones del tipo)
   * - Cambio de contraseña (revocar todas las sesiones)
   * - Logout desde todos los dispositivos
   *
   * Fuerza al usuario a re-autenticarse en todos los dispositivos afectados.
   */
  abstract revokeAllUserSessions(userId: string, type?: string): Promise<number>;

  /**
   * Actualiza el timestamp de última actividad de una sesión.
   *
   * @param sessionId - ID de la sesión a actualizar
   * @returns Sesión actualizada con lastUsedAt modificado
   *
   * @throws {DomainBaseError} Cuando falla la operación de actualización
   *
   * @remarks
   * Se invoca cada vez que se utiliza exitosamente un refresh token para
   * obtener un nuevo access token. Permite:
   * - Rastrear actividad de sesiones
   * - Implementar políticas de expiración por inactividad
   * - Auditoría de uso de tokens
   */
  abstract updateLastUsedAt(sessionId: string): Promise<SessionEntity>;

  /**
   * Elimina físicamente sesiones expiradas de la base de datos.
   *
   * @returns Número de sesiones eliminadas
   *
   * @throws {DomainBaseError} Cuando falla la operación de limpieza
   *
   * @remarks
   * Tarea de mantenimiento periódico que:
   * - Elimina sesiones donde expiresAt < fecha actual
   * - Reduce tamaño de la tabla y mejora rendimiento
   * - Debe ejecutarse mediante cron job o tarea programada
   *
   * No elimina sesiones revocadas que aún no han expirado (auditoría).
   */
  abstract cleanExpiredSessions(): Promise<number>;

  /**
   * Cuenta las sesiones activas de un usuario.
   *
   * @param userId - ID del usuario cuyas sesiones activas se contarán
   * @returns Número de sesiones activas (no revocadas ni expiradas)
   *
   * @throws {DomainBaseError} Cuando falla la operación de conteo
   *
   * @remarks
   * Útil para implementar límites de sesiones concurrentes por usuario.
   *
   * Criterios de sesión activa:
   * - revokedAt es null (no revocada)
   * - expiresAt > fecha actual (no expirada)
   */
  abstract countActiveSessions(userId: string): Promise<number>;
}

/**
 * Token de inyección de dependencias para el repositorio de sesiones.
 *
 * @remarks
 * Utilice este símbolo para inyectar implementaciones del {@link SessionRepository}
 * en constructores de casos de uso o servicios de aplicación.
 */
export const SESSION_REPOSITORY = Symbol('SessionRepository');
