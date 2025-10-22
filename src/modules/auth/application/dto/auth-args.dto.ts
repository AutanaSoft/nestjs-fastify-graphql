import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import {
  ForgotPasswordInputDto,
  RefreshTokenInputDto,
  ResetPasswordInputDto,
  RevokeRefreshTokenInputDto,
  SignInInputDto,
  SignUpInputDto,
  VerifyEmailInputDto,
} from './auth-inputs.dto';

/**
 * Args DTO para el registro de un nuevo usuario.
 */
@ArgsType()
export class SignUpArgsDto {
  @Field(() => SignUpInputDto, {
    description: 'Input data for user registration',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => SignUpInputDto)
  input!: SignUpInputDto;
}

/**
 * Args DTO para el inicio de sesión de un usuario.
 */
@ArgsType()
export class SignInArgsDto {
  @Field(() => SignInInputDto, {
    description: 'Input data for user authentication',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => SignInInputDto)
  input!: SignInInputDto;
}

/**
 * Args DTO para refrescar el token de autenticación.
 */
@ArgsType()
export class RefreshTokenArgsDto {
  @Field(() => RefreshTokenInputDto, {
    description: 'Input data for token refresh',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => RefreshTokenInputDto)
  input!: RefreshTokenInputDto;
}

/**
 * Args DTO para solicitar el restablecimiento de contraseña.
 */
@ArgsType()
export class ForgotPasswordArgsDto {
  @Field(() => ForgotPasswordInputDto, {
    description: 'Input data for password reset request',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => ForgotPasswordInputDto)
  input!: ForgotPasswordInputDto;
}

/**
 * Args DTO para restablecer la contraseña.
 */
@ArgsType()
export class ResetPasswordArgsDto {
  @Field(() => ResetPasswordInputDto, {
    description: 'Input data for password reset',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => ResetPasswordInputDto)
  input!: ResetPasswordInputDto;
}

/**
 * Args DTO para verificar el correo electrónico de un usuario.
 */
@ArgsType()
export class VerifyEmailArgsDto {
  @Field(() => VerifyEmailInputDto, {
    description: 'Input data for email verification',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => VerifyEmailInputDto)
  input!: VerifyEmailInputDto;
}

/**
 * Args DTO para revocar un refresh token (logout).
 */
@ArgsType()
export class RevokeRefreshTokenArgsDto {
  @Field(() => RevokeRefreshTokenInputDto, {
    description: 'Input data for token revocation',
    nullable: false,
  })
  @ValidateNested()
  @Type(() => RevokeRefreshTokenInputDto)
  input!: RevokeRefreshTokenInputDto;
}
