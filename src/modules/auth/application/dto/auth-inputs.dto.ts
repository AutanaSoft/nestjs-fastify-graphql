import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO de entrada para el registro de nuevos usuarios.
 *
 * Valida los datos necesarios para crear una nueva cuenta de usuario en el sistema,
 * incluyendo email, contraseña y nombre de usuario.
 */
@InputType({ description: 'Input data for user registration' })
export class SignUpInputDto {
  /**
   * Correo electrónico del usuario.
   *
   * Debe ser un email válido y único en el sistema.
   */
  @Field(() => String, { description: 'User email address', nullable: false })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  /**
   * Contraseña del usuario.
   *
   * Debe cumplir con los requisitos de seguridad establecidos.
   * Mínimo 8 caracteres.
   */
  @Field(() => String, { description: 'User password', nullable: false })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  /**
   * Nombre de usuario.
   *
   * Identificador único visible para otros usuarios del sistema.
   */
  @Field(() => String, { description: 'Unique username', nullable: false })
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  userName!: string;
}

/**
 * DTO de entrada para el inicio de sesión de usuarios.
 *
 * Contiene las credenciales de autenticación (email y contraseña) necesarias
 * para generar tokens de acceso y refresh.
 */
@InputType({ description: 'Input data for user authentication' })
export class SignInInputDto {
  /**
   * Correo electrónico del usuario registrado.
   */
  @Field(() => String, { description: 'User email address', nullable: false })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  /**
   * Contraseña del usuario.
   */
  @Field(() => String, { description: 'User password', nullable: false })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

/**
 * DTO de entrada para la renovación de tokens de acceso.
 *
 * Permite obtener un nuevo access token utilizando un refresh token válido,
 * sin necesidad de volver a proporcionar las credenciales de usuario.
 */
@InputType({ description: 'Input data for token refresh' })
export class RefreshTokenInputDto {
  /**
   * Token de actualización válido previamente emitido.
   *
   * Se utiliza para generar un nuevo access token sin reautenticación.
   */
  @Field(() => String, { description: 'Valid refresh token', nullable: false })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

/**
 * DTO de entrada para solicitar el restablecimiento de contraseña.
 *
 * Inicia el proceso de recuperación enviando un token de restablecimiento
 * al correo electrónico asociado a la cuenta de usuario.
 */
@InputType({ description: 'Input data for password reset request' })
export class ForgotPasswordInputDto {
  /**
   * Correo electrónico de la cuenta para la cual se solicita
   * el restablecimiento de contraseña.
   */
  @Field(() => String, {
    description: 'Email address for password reset',
    nullable: false,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

/**
 * DTO de entrada para restablecer la contraseña de un usuario.
 *
 * Permite establecer una nueva contraseña utilizando el token de
 * restablecimiento recibido por correo electrónico.
 */
@InputType({ description: 'Input data for password reset' })
export class ResetPasswordInputDto {
  /**
   * Token de restablecimiento recibido por correo electrónico.
   *
   * Debe ser un token válido y no expirado.
   */
  @Field(() => String, {
    description: 'Password reset token',
    nullable: false,
  })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;

  /**
   * Nueva contraseña del usuario.
   *
   * Debe cumplir con los requisitos de seguridad establecidos.
   * Mínimo 8 caracteres.
   */
  @Field(() => String, { description: 'New password', nullable: false })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

/**
 * DTO de entrada para la verificación de correo electrónico.
 *
 * Utiliza un token enviado por correo para confirmar la propiedad
 * del email y activar la cuenta de usuario.
 */
@InputType({ description: 'Input data for email verification' })
export class VerifyEmailInputDto {
  @Field(() => String, { description: 'Email verification token', nullable: false })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;
}
