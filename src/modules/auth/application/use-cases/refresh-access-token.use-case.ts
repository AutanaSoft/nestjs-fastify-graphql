import { USER_REPOSITORY, UserRepository } from '@/modules/users/domain/repository';
import { JwtTokenService } from '@/shared/applications/services';
import { DomainBaseError, NotFoundError } from '@/shared/domain/errors';
import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RefreshTokenService } from '../../domain/services';
import type { RefreshTokenContext, RefreshTokenResult } from '../../domain/types';

/**
 * Caso de uso para refrescar el access token usando un refresh token.
 *
 * Implementa el patrón de token rotation: valida el refresh token actual,
 * genera un nuevo access token y un nuevo refresh token, y revoca el token anterior.
 *
 * @public
 */
@Injectable()
export class RefreshAccessTokenUseCase {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @InjectPinoLogger(RefreshAccessTokenUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta el caso de uso de refresh token.
   *
   * @param refreshToken Refresh token opaco recibido del cliente
   * @param context Contexto de la solicitud (userAgent, IP, tipo)
   * @returns Resultado con nuevo access token y nuevo refresh token
   * @throws InvalidRefreshTokenError si el token es inválido
   * @throws ExpiredRefreshTokenError si el token ha expirado
   * @throws RevokedRefreshTokenError si se detecta reuso de token
   * @throws NotFoundError si el usuario asociado no existe
   */
  async execute(refreshToken: string, context: RefreshTokenContext): Promise<RefreshTokenResult> {
    this.logger.info({ method: 'execute' });

    // 1. Validar el refresh token actual
    const currentSession = await this.refreshTokenService.validateToken(refreshToken);

    this.logger.debug({ userId: currentSession.userId }, 'Refresh token validated');

    // 2. Obtener datos del usuario
    const userResult = await this.userRepository.findById(currentSession.userId);
    if (userResult instanceof DomainBaseError) throw userResult;
    const user = userResult;

    if (!user) {
      this.logger.error(
        { userId: currentSession.userId },
        'User not found for valid refresh token',
      );
      throw new NotFoundError(`User with id ${currentSession.userId} not found`);
    }

    // 3. Generar nuevo access token
    const {
      token: accessToken,
      createdAt,
      expiredAt,
    } = await this.jwtTokenService.generateAccessToken(user);

    // 4. Rotar el refresh token (revocar actual y crear nuevo)
    const [newRefreshToken] = await this.refreshTokenService.rotateToken(currentSession, context);

    this.logger.info(
      { userId: user.id, sessionId: currentSession.id },
      'Access token refreshed successfully',
    );

    // 5. Retornar nuevo access token y nuevo refresh token
    return {
      accessToken,
      refreshToken: newRefreshToken,
      createdAt,
      expiredAt,
    };
  }
}
