import { USER_REPOSITORY, UserRepository } from '@/modules/users/domain/repository';
import { UserEmail, UserName, UserPassword } from '@/modules/users/domain/value-objects';
import { JwtTokenService } from '@/shared/applications/services';
import { HashUtils } from '@/shared/applications/utils';
import { SessionType } from '@/shared/domain/enums';
import { DomainBaseError } from '@/shared/domain/errors';
import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RefreshTokenService } from '../../domain/services';
import type { RefreshTokenContext } from '../../domain/types';
import { AuthCredentialsDto, SignUpArgsDto } from '../dto';

/**
 * Caso de uso para el registro de nuevos usuarios.
 *
 * Crea un nuevo usuario en el sistema, genera tokens de autenticación
 * y establece una sesión con refresh token.
 *
 * @public
 */
@Injectable()
export class SignUpUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    @InjectPinoLogger(SignUpUseCase.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * Ejecuta el caso de uso de registro de usuario.
   *
   * @param command Datos del usuario a registrar
   * @param context Contexto de la solicitud (userAgent, IP, tipo de sesión)
   * @returns Credenciales de autenticación con access token y refresh token
   */
  async execute(
    command: SignUpArgsDto,
    context?: RefreshTokenContext,
  ): Promise<AuthCredentialsDto> {
    this.logger.info({ command }, 'Executing SignUpUseCase');

    // Validar y crear value objects
    const userName = new UserName(command.input.userName);
    const userEmail = new UserEmail(command.input.email);
    const userPassword = new UserPassword(command.input.password);

    // Hashear la contraseña
    const hashedPassword = await HashUtils.hashPassword(userPassword.getValue());

    // Crear el usuario
    const user = await this.userRepository.create({
      userName: userName.getValue(),
      email: userEmail.getValue(),
      password: hashedPassword,
    });

    if (user instanceof DomainBaseError) throw user;

    this.logger.info({ userId: user.id }, 'User created successfully');

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
      'Session created with refresh token',
    );

    return {
      accessToken,
      refreshToken,
      createdAt,
      expiredAt,
    };
  }
}
