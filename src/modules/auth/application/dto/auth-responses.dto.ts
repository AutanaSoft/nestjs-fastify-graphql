import { Field, ObjectType } from '@nestjs/graphql';

/**
 * DTO de respuesta que contiene las credenciales de autenticación.
 * Incluye tokens de acceso y actualización con sus metadatos temporales.
 */
@ObjectType()
export class AuthCredentialsDto {
  @Field(() => String)
  accessToken: string;

  @Field(() => String)
  refreshToken: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  expiredAt: Date;
}

/**
 *  DTO base para respuestas que indican éxito o fracaso de una operación.
 */
@ObjectType()
class AuthSuccessResponseDto {
  @Field(() => Boolean)
  success: boolean;
}

/**
 * DTO de respuesta para la operación de cierre de sesión.
 * Indica si el usuario se desconectó exitosamente.
 */
@ObjectType()
export class SignOutResponseDto extends AuthSuccessResponseDto {}

/**
 * DTO de respuesta para la operación de olvido de contraseña.
 * Indica si el correo de recuperación fue enviado exitosamente.
 */
@ObjectType()
export class ForgotPasswordResponseDto extends AuthSuccessResponseDto {}

/**
 * DTO de respuesta para la operación de restablecimiento de contraseña.
 * Indica si la contraseña fue restablecida exitosamente.
 */
@ObjectType()
export class ResetPasswordResponseDto extends AuthSuccessResponseDto {}

/**
 * DTO de respuesta para la operación de verificación de correo electrónico.
 * Indica si el correo fue verificado exitosamente.
 */
@ObjectType()
export class VerifyEmailResponseDto extends AuthSuccessResponseDto {}

/**
 * DTO de respuesta para la revocación de refresh token.
 * Indica si el token fue revocado exitosamente.
 */
@ObjectType()
export class RevokeRefreshTokenResponseDto extends AuthSuccessResponseDto {}
