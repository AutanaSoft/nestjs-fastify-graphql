import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RefreshTokenService } from '../../domain/services';

/**
 * Caso de uso para revocar un refresh token (logout).
 *
 * Marca una sesión como revocada, invalidando el refresh token asociado.
 *
 * @public
 */
@Injectable()
export class RevokeRefreshTokenUseCase {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    @InjectPinoLogger(RevokeRefreshTokenUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta el caso de uso de revocación de refresh token.
   *
   * @param refreshToken Refresh token opaco a revocar
   * @returns true si el token fue revocado exitosamente
   * @throws InvalidRefreshTokenError si el token es inválido
   * @throws ExpiredRefreshTokenError si el token ya expiró
   */
  async execute(refreshToken: string): Promise<boolean> {
    this.logger.info({ method: 'execute' });

    // 1. Validar el refresh token
    const session = await this.refreshTokenService.validateToken(refreshToken);

    this.logger.debug({ sessionId: session.id, userId: session.userId }, 'Token validated');

    // 2. Revocar la sesión
    await this.refreshTokenService.revokeSession(session.id);

    this.logger.info(
      { sessionId: session.id, userId: session.userId },
      'Token revoked successfully',
    );

    return true;
  }
}
