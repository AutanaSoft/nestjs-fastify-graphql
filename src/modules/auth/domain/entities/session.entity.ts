import { SessionType } from '@/shared/domain/enums';

/**
 * Entidad de dominio para sesiones de usuario.
 *
 * Representa una sesión activa con un refresh token asociado.
 * Cada sesión tiene un ciclo de vida controlado por expiración y revocación.
 *
 * @public
 */
export class SessionEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly refreshTokenHash: string,
    public readonly type: SessionType,
    public readonly expiresAt: Date,
    public readonly userAgent?: string,
    public readonly ipAddress?: string,
    public readonly lastUsedAt?: Date,
    public readonly revoked: boolean = false,
    public readonly revokedAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  /**
   * Verifica si la sesión ha expirado.
   *
   * @returns true si la fecha de expiración es anterior a la fecha actual
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Verifica si la sesión está activa.
   *
   * Una sesión está activa si no está revocada y no ha expirado.
   *
   * @returns true si la sesión es válida y utilizable
   */
  isActive(): boolean {
    return !this.revoked && !this.isExpired();
  }

  /**
   * Crea una nueva sesión con valores actualizados.
   *
   * @param updates - Propiedades parciales a actualizar
   * @returns Nueva instancia de SessionEntity con los cambios aplicados
   */
  update(updates: Partial<Omit<SessionEntity, 'id' | 'userId' | 'createdAt'>>): SessionEntity {
    return new SessionEntity(
      this.id,
      this.userId,
      updates.refreshTokenHash ?? this.refreshTokenHash,
      updates.type ?? this.type,
      updates.expiresAt ?? this.expiresAt,
      updates.userAgent ?? this.userAgent,
      updates.ipAddress ?? this.ipAddress,
      updates.lastUsedAt ?? this.lastUsedAt,
      updates.revoked ?? this.revoked,
      updates.revokedAt ?? this.revokedAt,
      this.createdAt,
      updates.updatedAt ?? new Date(),
    );
  }

  /**
   * Crea una sesión revocada.
   *
   * @returns Nueva instancia de SessionEntity marcada como revocada
   */
  revoke(): SessionEntity {
    return this.update({
      revoked: true,
      revokedAt: new Date(),
    });
  }
}
