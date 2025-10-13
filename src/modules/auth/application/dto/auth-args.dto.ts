import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import {
  ForgotPasswordInputDto,
  RefreshTokenInputDto,
  ResetPasswordInputDto,
  SignInInputDto,
  SignUpInputDto,
} from './auth-inputs.dto';

/**
 * Args DTO para el registro de un nuevo usuario.
 */
@ArgsType()
export class SignUpArgsDto {
  @Field(() => SignUpInputDto)
  @ValidateNested()
  @Type(() => SignUpInputDto)
  input: SignUpInputDto;
}

/**
 * Args DTO para el inicio de sesión de un usuario.
 */
@ArgsType()
export class SignInArgsDto {
  @Field(() => SignInInputDto)
  @ValidateNested()
  @Type(() => SignInInputDto)
  input: SignInInputDto;
}

/**
 * Args DTO para refrescar el token de autenticación.
 */
@ArgsType()
export class RefreshTokenArgsDto {
  @Field(() => RefreshTokenInputDto)
  @ValidateNested()
  @Type(() => RefreshTokenInputDto)
  input: RefreshTokenInputDto;
}

/**
 * Args DTO para solicitar el restablecimiento de contraseña.
 */
@ArgsType()
export class ForgotPasswordArgsDto {
  @Field(() => ForgotPasswordInputDto)
  @ValidateNested()
  @Type(() => ForgotPasswordInputDto)
  input: ForgotPasswordInputDto;
}

/**
 * Args DTO para restablecer la contraseña.
 */
@ArgsType()
export class ResetPasswordArgsDto {
  @Field(() => ResetPasswordInputDto)
  @ValidateNested()
  @Type(() => ResetPasswordInputDto)
  input: ResetPasswordInputDto;
}
