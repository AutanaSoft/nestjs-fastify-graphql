import { SessionType } from '@/shared/domain/enums';
import type { GraphQLContext } from '@/shared/domain/types';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  AuthCredentialsDto,
  ForgotPasswordArgsDto,
  ForgotPasswordResponseDto,
  RefreshTokenArgsDto,
  ResetPasswordArgsDto,
  ResetPasswordResponseDto,
  RevokeRefreshTokenArgsDto,
  RevokeRefreshTokenResponseDto,
  SignInArgsDto,
  SignUpArgsDto,
  VerifyEmailArgsDto,
  VerifyEmailResponseDto,
} from '../../application/dto';
import {
  RefreshAccessTokenUseCase,
  RevokeRefreshTokenUseCase,
  SignUpUseCase,
} from '../../application/use-cases';

@Resolver()
export class AuthResolver {
  constructor(
    @InjectPinoLogger(AuthResolver.name) private readonly logger: PinoLogger,
    private readonly signUpUseCase: SignUpUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
    private readonly revokeRefreshTokenUseCase: RevokeRefreshTokenUseCase,
  ) {}

  @Mutation(() => AuthCredentialsDto, { name: 'signUp', description: 'Sign up a new user' })
  async signUp(
    @Args() params: SignUpArgsDto,
    @Context() context: GraphQLContext,
  ): Promise<AuthCredentialsDto> {
    this.logger.assign({ resolver: 'signUp' });
    this.logger.info('Sign up request received');

    const credentials = await this.signUpUseCase.execute(params, {
      userAgent: context.req.headers['user-agent'],
      ipAddress: context.req.ip,
      type: SessionType.WEB,
    });

    this.logger.info('User signed up successfully');
    return credentials;
  }

  @Query(() => AuthCredentialsDto, { name: 'signIn', description: 'Sign in an existing user' })
  signIn(@Args() params: SignInArgsDto): AuthCredentialsDto {
    this.logger.assign({ resolver: 'signIn', params });
    this.logger.info('Sign in request received');
    // Implement sign-in logic here
    this.logger.info('User signed in successfully');
    return new AuthCredentialsDto();
  }

  @Mutation(() => AuthCredentialsDto, { name: 'refreshToken', description: 'Refresh auth token' })
  async refreshToken(
    @Args() params: RefreshTokenArgsDto,
    @Context() context: GraphQLContext,
  ): Promise<AuthCredentialsDto> {
    this.logger.assign({ resolver: 'refreshToken' });
    this.logger.info('Refresh token request received');

    const result = await this.refreshAccessTokenUseCase.execute(params.input.refreshToken, {
      userAgent: context.req.headers['user-agent'],
      ipAddress: context.req.ip,
      type: SessionType.WEB, // TODO: Detectar tipo desde el contexto
    });

    this.logger.info('Auth token refreshed successfully');

    return result;
  }

  @Mutation(() => ForgotPasswordResponseDto, {
    name: 'forgetPassword',
    description: 'Initiate forget password process',
  })
  forgetPassword(@Args() params: ForgotPasswordArgsDto): ForgotPasswordResponseDto {
    this.logger.assign({ resolver: 'forgetPassword', params });
    this.logger.info('Forget password request received');
    // Implement forget password logic here
    this.logger.info('Forget password process initiated successfully');
    return new ForgotPasswordResponseDto();
  }

  @Mutation(() => ResetPasswordResponseDto, {
    name: 'resetPassword',
    description: 'Reset user password',
  })
  resetPassword(@Args() params: ResetPasswordArgsDto): ResetPasswordResponseDto {
    this.logger.assign({ resolver: 'resetPassword', params });
    this.logger.info('Reset password request received');
    // Implement reset password logic here
    this.logger.info('User password reset successfully');
    return new ResetPasswordResponseDto();
  }

  @Mutation(() => VerifyEmailResponseDto, {
    name: 'verifyEmail',
    description: 'Verify user email address',
  })
  verifyEmail(@Args() params: VerifyEmailArgsDto): VerifyEmailResponseDto {
    this.logger.assign({ resolver: 'verifyEmail', params });
    this.logger.info('Verify email request received');
    // Implement email verification logic here
    this.logger.info('User email verified successfully');
    return new VerifyEmailResponseDto();
  }

  @Mutation(() => RevokeRefreshTokenResponseDto, {
    name: 'revokeRefreshToken',
    description: 'Revoke a refresh token (logout)',
  })
  async revokeRefreshToken(
    @Args() params: RevokeRefreshTokenArgsDto,
  ): Promise<RevokeRefreshTokenResponseDto> {
    this.logger.assign({ resolver: 'revokeRefreshToken' });
    this.logger.info('Revoke refresh token request received');

    const success = await this.revokeRefreshTokenUseCase.execute(params.input.refreshToken);

    this.logger.info('Refresh token revoked successfully');

    return { success };
  }
}
