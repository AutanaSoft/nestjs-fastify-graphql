/**
 * Enum que define los diferentes tipos de tokens JWT temporales usados para varios flujos de autenticación
 */
export enum JwtTempTokenType {
  FORGOT_PASSWORD = 'forgot_password',
  RESET_PASSWORD = 'reset_password',
  VERIFY_EMAIL = 'verify_email',
}
