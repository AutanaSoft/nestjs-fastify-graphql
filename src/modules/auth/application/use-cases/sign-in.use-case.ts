import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { USER_REPOSITORY, UserRepository } from '@/modules/users/domain/repository';
import { UserStatus } from '@/modules/users/domain/enums';
import { JwtTokenService } from '@/shared/applications/services';
import { HashUtils } from '@/shared/applications/utils';
import { DomainBaseError } from '@/shared/domain/errors';
import { SessionType } from '@/shared/domain/enums';

import { RefreshTokenService } from '../../domain/services';
import type { RefreshTokenContext } from '../../domain/types';
import { AuthCredentialsDto, SignInArgsDto } from '../dto';
import {
  createInvalidCredentialsError,
  createAccountNotVerifiedError,
  createAccountSuspendedError,
} from '../../domain/errors';

/**
 * Caso de uso para el inicio de sesión de usuarios.
 * Valida las credenciales, verifica el estado de la cuenta y genera tokens de acceso.
 */
@Injectable()
export class SignInUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    @InjectPinoLogger(SignInUseCase.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta el proceso de inicio de sesión.
   *
   * @param command Argumentos que contienen las credenciales del usuario
   * @param context Contexto de la solicitud (userAgent, IP, tipo de sesión)
   * @returns Credenciales de autenticación con access token y refresh token
   * @throws DomainBaseError Cuando las credenciales son incorrectas, la cuenta no está verificada o está suspendida
   */
  async execute(
    command: SignInArgsDto,
    context?: RefreshTokenContext,
  ): Promise<AuthCredentialsDto> {
    const { input } = command;
    this.logger.info({ email: input.email }, 'Attempting sign-in');

    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(input.email);

    if (user instanceof DomainBaseError) {
      throw user;
    }

    if (!user) {
      this.logger.warn({ email: input.email }, 'Sign-in failed: User not found');
      throw createInvalidCredentialsError();
    }

    // Verificar contraseña
    const isPasswordValid = await HashUtils.comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn({ userId: user.id }, 'Sign-in failed: Invalid password');
      throw createInvalidCredentialsError();
    }

    // Verificar estado de la cuenta
    if (!user.emailVerified) {
      this.logger.warn({ userId: user.id }, 'Sign-in failed: Email not verified');
      throw createAccountNotVerifiedError(user.email);
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED) {
      this.logger.warn(
        { userId: user.id, status: user.status },
        'Sign-in failed: Account suspended',
      );
      throw createAccountSuspendedError(user.status);
    }

    // Generar access token
    const {
      token: accessToken,
      createdAt,
      expiredAt,
    } = await this.jwtTokenService.generateAccessToken(user);

    // Crear sesión con refresh token
    const sessionContext: RefreshTokenContext = {
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      type: context?.type ?? SessionType.WEB,
    };

    const [refreshToken, session] = await this.refreshTokenService.createSession(
      user.id,
      sessionContext,
    );

    this.logger.info(
      { userId: user.id, sessionId: session.id },
      'Sign-in successful, session created',
    );

    return {
      accessToken,
      refreshToken,
      createdAt,
      expiredAt,
    };
  }
}
