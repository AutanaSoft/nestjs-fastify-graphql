import { PrismaService, HandlerOrmErrorsService } from '@/shared/applications/services';
import { SessionType } from '@/shared/domain/enums';
import { DomainBaseError } from '@/shared/domain/errors';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SessionEntity } from '../../domain/entities';
import { SessionRepository } from '../../domain/repositories';
import type { CreateSessionData } from '../../domain/types';
import { SESSION_ORM_ERROR_CONFIG } from '../config';

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
    private readonly handlerOrmErrorsService: HandlerOrmErrorsService,
    @InjectPinoLogger(SessionPrismaAdapter.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Crea una nueva sesión en la base de datos.
   *
   * @param data Datos para crear la sesión
   * @returns Sesión creada o error de dominio
   */
  async create(data: CreateSessionData): Promise<SessionEntity | DomainBaseError> {
    this.logger.debug({ method: 'create', userId: data.userId });

    try {
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
    } catch (error) {
      return this.handlerOrmErrorsService.handleError(error, SESSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Busca una sesión por el hash del refresh token.
   *
   * @param refreshTokenHash Hash SHA-256 del refresh token
   * @returns Sesión encontrada, null si no existe, o error de dominio
   */
  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<SessionEntity | null | DomainBaseError> {
    this.logger.debug({ method: 'findByRefreshTokenHash' });

    try {
      const session = await this.prisma.session.findUnique({
        where: { refreshToken: refreshTokenHash },
      });

      if (!session) {
        this.logger.debug('Session not found by refresh token hash');
        return null;
      }

      return this.toDomain(session);
    } catch (error) {
      return this.handlerOrmErrorsService.handleError(error, SESSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Busca una sesión por su ID.
   *
   * @param sessionId ID de la sesión
   * @returns Sesión encontrada, null si no existe, o error de dominio
   */
  async findById(sessionId: string): Promise<SessionEntity | null | DomainBaseError> {
    this.logger.debug({ method: 'findById', sessionId });

    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        this.logger.debug({ sessionId }, 'Session not found');
        return null;
      }

      return this.toDomain(session);
    } catch (error) {
      return this.handlerOrmErrorsService.handleError(error, SESSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Revoca una sesión específica.
   *
   * @param sessionId ID de la sesión a revocar
   * @returns Sesión revocada o error de dominio
   */
  async revokeSession(sessionId: string): Promise<SessionEntity | DomainBaseError> {
    this.logger.debug({ method: 'revokeSession', sessionId });

    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          revoked: true,
          revokedAt: new Date(),
        },
      });

      this.logger.info({ sessionId }, 'Session revoked successfully');
      return this.toDomain(session);
    } catch (error) {
      return this.handlerOrmErrorsService.handleError(error, SESSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Revoca todas las sesiones activas de un usuario.
   *
   * @param userId ID del usuario
   * @param type Tipo de sesión opcional (WEB, MOBILE, API)
   * @returns Número de sesiones revocadas o error de dominio
   */
  async revokeAllUserSessions(userId: string, type?: string): Promise<number | DomainBaseError> {
    this.logger.debug({ method: 'revokeAllUserSessions', userId, type });

    try {
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
    } catch (error) {
      return this.handlerOrmErrorsService.handleError(error, SESSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Actualiza la fecha de último uso de una sesión.
   *
   * @param sessionId ID de la sesión
   * @returns Sesión actualizada o error de dominio
   */
  async updateLastUsedAt(sessionId: string): Promise<SessionEntity | DomainBaseError> {
    this.logger.debug({ method: 'updateLastUsedAt', sessionId });

    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: { lastUsedAt: new Date() },
      });

      return this.toDomain(session);
    } catch (error) {
      return this.handlerOrmErrorsService.handleError(error, SESSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Elimina sesiones expiradas de la base de datos.
   *
   * @returns Número de sesiones eliminadas o error de dominio
   */
  async cleanExpiredSessions(): Promise<number | DomainBaseError> {
    this.logger.debug({ method: 'cleanExpiredSessions' });

    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.info({ count: result.count }, 'Expired sessions cleaned');
      return result.count;
    } catch (error) {
      return this.handlerOrmErrorsService.handleError(error, SESSION_ORM_ERROR_CONFIG);
    }
  }

  /**
   * Cuenta el número de sesiones activas de un usuario.
   *
   * @param userId ID del usuario
   * @returns Número de sesiones activas o error de dominio
   */
  async countActiveSessions(userId: string): Promise<number | DomainBaseError> {
    this.logger.debug({ method: 'countActiveSessions', userId });

    try {
      const count = await this.prisma.session.count({
        where: {
          userId,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      return count;
    } catch (error) {
      return this.handlerOrmErrorsService.handleError(error, SESSION_ORM_ERROR_CONFIG);
    }
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
