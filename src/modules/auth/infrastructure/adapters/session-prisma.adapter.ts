import { PrismaService } from '@/shared/applications/services';
import { SessionType } from '@/shared/domain/enums';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SessionEntity } from '../../domain/entities';
import { SessionRepository } from '../../domain/repositories';
import type { CreateSessionData } from '../../domain/types';

/**
 * Implementación Prisma del repositorio de sesiones.
 *
 * Adapter que conecta el dominio con la base de datos PostgreSQL
 * usando Prisma ORM.
 *
 * @public
 */
@Injectable()
export class SessionPrismaAdapter implements SessionRepository {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(SessionPrismaAdapter.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Crea una nueva sesión en la base de datos.
   *
   * @param data Datos para crear la sesión
   * @returns Sesión creada
   */
  async create(data: CreateSessionData): Promise<SessionEntity> {
    this.logger.debug({ method: 'create', userId: data.userId });

    const session = await this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshToken: data.refreshTokenHash,
        type: data.type,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });

    this.logger.info({ sessionId: session.id }, 'Session created successfully');
    return this.toDomain(session);
  }

  /**
   * Busca una sesión por el hash del refresh token.
   *
   * @param refreshTokenHash Hash SHA-256 del refresh token
   * @returns Sesión encontrada o null si no existe
   */
  async findByRefreshTokenHash(refreshTokenHash: string): Promise<SessionEntity | null> {
    this.logger.debug({ method: 'findByRefreshTokenHash' });

    const session = await this.prisma.session.findUnique({
      where: { refreshToken: refreshTokenHash },
    });

    if (!session) {
      this.logger.debug('Session not found by refresh token hash');
      return null;
    }

    return this.toDomain(session);
  }

  /**
   * Busca una sesión por su ID.
   *
   * @param sessionId ID de la sesión
   * @returns Sesión encontrada o null si no existe
   */
  async findById(sessionId: string): Promise<SessionEntity | null> {
    this.logger.debug({ method: 'findById', sessionId });

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      this.logger.debug({ sessionId }, 'Session not found');
      return null;
    }

    return this.toDomain(session);
  }

  /**
   * Revoca una sesión específica.
   *
   * @param sessionId ID de la sesión a revocar
   * @returns Sesión revocada
   */
  async revokeSession(sessionId: string): Promise<SessionEntity> {
    this.logger.debug({ method: 'revokeSession', sessionId });

    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });

    this.logger.info({ sessionId }, 'Session revoked successfully');
    return this.toDomain(session);
  }

  /**
   * Revoca todas las sesiones activas de un usuario.
   *
   * @param userId ID del usuario
   * @param type Tipo de sesión opcional (WEB, MOBILE, API)
   * @returns Número de sesiones revocadas
   */
  async revokeAllUserSessions(userId: string, type?: string): Promise<number> {
    this.logger.debug({ method: 'revokeAllUserSessions', userId, type });

    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revoked: false,
        ...(type && { type: type as SessionType }),
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });

    this.logger.warn(
      { userId, type, count: result.count },
      'All user sessions revoked - possible token reuse detected',
    );

    return result.count;
  }

  /**
   * Actualiza la fecha de último uso de una sesión.
   *
   * @param sessionId ID de la sesión
   * @returns Sesión actualizada
   */
  async updateLastUsedAt(sessionId: string): Promise<SessionEntity> {
    this.logger.debug({ method: 'updateLastUsedAt', sessionId });

    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });

    return this.toDomain(session);
  }

  /**
   * Elimina sesiones expiradas de la base de datos.
   *
   * @returns Número de sesiones eliminadas
   */
  async cleanExpiredSessions(): Promise<number> {
    this.logger.debug({ method: 'cleanExpiredSessions' });

    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.info({ count: result.count }, 'Expired sessions cleaned');
    return result.count;
  }

  /**
   * Cuenta el número de sesiones activas de un usuario.
   *
   * @param userId ID del usuario
   * @returns Número de sesiones activas
   */
  async countActiveSessions(userId: string): Promise<number> {
    this.logger.debug({ method: 'countActiveSessions', userId });

    const count = await this.prisma.session.count({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    return count;
  }

  /**
   * Convierte un modelo de Prisma a entidad de dominio.
   *
   * @param session Modelo de sesión de Prisma
   * @returns Entidad de dominio SessionEntity
   */
  private toDomain(session: {
    id: string;
    userId: string;
    refreshToken: string;
    type: string;
    expiresAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
    lastUsedAt: Date | null;
    revoked: boolean;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SessionEntity {
    return new SessionEntity(
      session.id,
      session.userId,
      session.refreshToken,
      session.type as SessionType,
      session.expiresAt,
      session.userAgent ?? undefined,
      session.ipAddress ?? undefined,
      session.lastUsedAt ?? undefined,
      session.revoked,
      session.revokedAt ?? undefined,
      session.createdAt,
      session.updatedAt,
    );
  }
}
