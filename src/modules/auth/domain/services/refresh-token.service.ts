import { jwtConfig } from '@/config';
import { CryptoService } from '@/shared/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SessionEntity } from '../entities';
import {
  ExpiredRefreshTokenError,
  InvalidRefreshTokenError,
  RevokedRefreshTokenError,
} from '../errors';
import { SessionRepository } from '../repositories';
import type { CreateSessionData, RefreshTokenContext } from '../types';

/**
 * Servicio de dominio para gestión de refresh tokens.
 *
 * Encapsula la lógica de negocio para generación, validación y
 * rotación de refresh tokens con detección de reuso.
 *
 * @public
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly cryptoService: CryptoService,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
    @InjectPinoLogger(RefreshTokenService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Genera un nuevo refresh token opaco.
   *
   * El token generado es un string aleatorio codificado en base64url
   * para ser usado en URLs sin problemas de codificación.
   *
   * @returns Token opaco de 32 bytes (≈43 caracteres)
   */
  generateOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Calcula el hash SHA-256 de un refresh token.
   *
   * @param token Token opaco a hashear
   * @returns Hash SHA-256 en formato hexadecimal (64 caracteres)
   */
  hashToken(token: string): string {
    return this.cryptoService.hash(token);
  }

  /**
   * Crea una nueva sesión con refresh token.
   *
   * Genera un token opaco, calcula su hash y crea una sesión en la base de datos.
   *
   * @param userId ID del usuario propietario de la sesión
   * @param context Contexto de la solicitud (userAgent, IP, tipo de sesión)
   * @returns Tupla con [token opaco, sesión creada]
   */
  async createSession(
    userId: string,
    context: RefreshTokenContext,
  ): Promise<[string, SessionEntity]> {
    this.logger.debug({ method: 'createSession', userId });

    // Generar token opaco
    const opaqueToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(opaqueToken);

    // Calcular fecha de expiración
    const expiresAt = this.calculateExpirationDate(this.config.refreshExpiresIn);

    // Crear datos de sesión
    const sessionData: CreateSessionData = {
      userId,
      refreshTokenHash: tokenHash,
      type: context.type,
      expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    };

    // Crear sesión en la base de datos
    const session = await this.sessionRepository.create(sessionData);

    this.logger.info({ sessionId: session.id, userId }, 'Session created with refresh token');

    // Retornar token opaco (NO el hash) y la sesión
    return [opaqueToken, session];
  }

  /**
   * Valida un refresh token y retorna la sesión asociada.
   *
   * Realiza las siguientes validaciones:
   * - El token existe en la base de datos
   * - El token no ha expirado
   * - El token no ha sido revocado (detección de reuso)
   *
   * @param opaqueToken Token opaco recibido del cliente
   * @returns Sesión válida asociada al token
   * @throws InvalidRefreshTokenError si el token no existe
   * @throws ExpiredRefreshTokenError si el token ha expirado
   * @throws RevokedRefreshTokenError si el token fue revocado (posible reuso)
   */
  async validateToken(opaqueToken: string): Promise<SessionEntity> {
    this.logger.debug({ method: 'validateToken' });

    // Hashear el token recibido para buscar en DB
    const tokenHash = this.hashToken(opaqueToken);

    // Buscar sesión por hash
    const session = await this.sessionRepository.findByRefreshTokenHash(tokenHash);

    if (!session) {
      this.logger.warn('Invalid refresh token - session not found');
      throw new InvalidRefreshTokenError();
    }

    // Verificar si el token ha expirado
    if (session.isExpired()) {
      this.logger.warn({ sessionId: session.id }, 'Refresh token has expired');
      throw new ExpiredRefreshTokenError();
    }

    // DETECCIÓN DE REUSO: Si el token está revocado pero se intenta usar
    if (session.revoked) {
      this.logger.error(
        { sessionId: session.id, userId: session.userId },
        'SECURITY ALERT: Revoked refresh token reuse detected - revoking all user sessions',
      );

      // Revocar TODAS las sesiones del usuario del mismo tipo
      await this.sessionRepository.revokeAllUserSessions(session.userId, session.type);

      throw new RevokedRefreshTokenError();
    }

    this.logger.debug({ sessionId: session.id }, 'Refresh token validated successfully');
    return session;
  }

  /**
   * Rota un refresh token: revoca el actual y crea uno nuevo.
   *
   * Implementa el patrón de token rotation para mitigar riesgos de seguridad.
   * El token anterior se revoca inmediatamente después de usarlo.
   *
   * @param currentSession Sesión actual a rotar
   * @param context Contexto de la nueva solicitud
   * @returns Tupla con [nuevo token opaco, nueva sesión]
   */
  async rotateToken(
    currentSession: SessionEntity,
    context: RefreshTokenContext,
  ): Promise<[string, SessionEntity]> {
    this.logger.debug({ method: 'rotateToken', sessionId: currentSession.id });

    // Actualizar última fecha de uso de la sesión actual
    await this.sessionRepository.updateLastUsedAt(currentSession.id);

    // Revocar la sesión actual
    await this.sessionRepository.revokeSession(currentSession.id);
    this.logger.debug({ sessionId: currentSession.id }, 'Current session revoked for rotation');

    // Crear nueva sesión con nuevo token
    const [newToken, newSession] = await this.createSession(currentSession.userId, context);

    this.logger.info(
      { oldSessionId: currentSession.id, newSessionId: newSession.id },
      'Refresh token rotated successfully',
    );

    return [newToken, newSession];
  }

  /**
   * Revoca una sesión específica.
   *
   * Útil para logout o revocación manual de tokens.
   *
   * @param sessionId ID de la sesión a revocar
   */
  async revokeSession(sessionId: string): Promise<void> {
    this.logger.debug({ method: 'revokeSession', sessionId });

    await this.sessionRepository.revokeSession(sessionId);

    this.logger.info({ sessionId }, 'Session revoked successfully');
  }

  /**
   * Revoca todas las sesiones activas de un usuario.
   *
   * Útil para "logout everywhere" o cuando se detecta actividad sospechosa.
   *
   * @param userId ID del usuario
   * @param type Tipo de sesión opcional (WEB, MOBILE, API)
   * @returns Número de sesiones revocadas
   */
  async revokeAllUserSessions(userId: string, type?: string): Promise<number> {
    this.logger.debug({ method: 'revokeAllUserSessions', userId, type });

    const count = await this.sessionRepository.revokeAllUserSessions(userId, type);

    this.logger.info({ userId, type, count }, 'All user sessions revoked');

    return count;
  }

  /**
   * Limpia sesiones expiradas de la base de datos.
   *
   * Debe ejecutarse periódicamente (ej: cron job) para mantener
   * la base de datos limpia.
   *
   * @returns Número de sesiones eliminadas
   */
  async cleanExpiredSessions(): Promise<number> {
    this.logger.debug({ method: 'cleanExpiredSessions' });

    const count = await this.sessionRepository.cleanExpiredSessions();

    this.logger.info({ count }, 'Expired sessions cleaned');

    return count;
  }

  /**
   * Calcula la fecha de expiración a partir de una duración.
   *
   * @param duration Duración en formato string (ej: '7d', '24h', '60m')
   * @returns Fecha de expiración
   */
  private calculateExpirationDate(duration: string): Date {
    const now = new Date();
    const milliseconds = this.parseDuration(duration);
    return new Date(now.getTime() + milliseconds);
  }

  /**
   * Parsea una duración en formato string a milisegundos.
   *
   * Soporta formatos: 's' (segundos), 'm' (minutos), 'h' (horas), 'd' (días)
   *
   * @param duration Duración en formato string (ej: '7d', '24h')
   * @returns Duración en milisegundos
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      this.logger.warn({ duration }, 'Invalid duration format, defaulting to 7 days');
      return 7 * 24 * 60 * 60 * 1000; // 7 días por defecto
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000, // segundos
      m: 60 * 1000, // minutos
      h: 60 * 60 * 1000, // horas
      d: 24 * 60 * 60 * 1000, // días
    };

    return value * multipliers[unit];
  }
}
