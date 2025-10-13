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
 * DTO de respuesta para la operación de olvido de contraseña.
 * Indica si el correo de recuperación fue enviado exitosamente.
 */
@ObjectType()
export class ForgotPasswordResponseDto {
  @Field(() => Boolean)
  success: boolean;
}

/**
 * DTO de respuesta para la operación de restablecimiento de contraseña.
 * Indica si la contraseña fue restablecida exitosamente.
 */
@ObjectType()
export class ResetPasswordResponseDto {
  @Field(() => Boolean)
  success: boolean;
}
