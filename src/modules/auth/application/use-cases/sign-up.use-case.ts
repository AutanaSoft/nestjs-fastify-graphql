import { USER_REPOSITORY, UserRepository } from '@/modules/users/domain/repository';
import { UserEmail, UserName, UserPassword } from '@/modules/users/domain/value-objects';
import { HashUtils } from '@/shared/applications/utils';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthCredentialsDto, SignUpArgsDto } from '../dto';

const AuthCredentialsMock = {
  accessToken: 'mockedAccessToken',
  refreshToken: 'mockedRefreshToken',
  createdAt: new Date(),
  expiredAt: new Date(Date.now() + 3600 * 1000), // 1 hour later
};

@Injectable()
export class SignUpUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @InjectPinoLogger(SignUpUseCase.name) private readonly logger: PinoLogger,
  ) {}

  async execute(command: SignUpArgsDto): Promise<AuthCredentialsDto> {
    this.logger.info({ command }, 'Executing SignUpUseCase');

    // Validar si el usuario ya existe por email o nombre de usuario
    const userName = new UserName(command.input.userName);
    const userEmail = new UserEmail(command.input.email);
    const userPassword = new UserPassword(command.input.password);
    const hashedPassword = await HashUtils.hashPassword(userPassword.getValue());
    const user = await this.userRepository.create({
      userName: userName.getValue(),
      email: userEmail.getValue(),
      password: hashedPassword,
    });

    this.logger.info({ userId: user.id }, 'User created successfully');
    return plainToInstance(AuthCredentialsDto, AuthCredentialsMock);
  }
}
