import { Prisma, UserRole, UserStatus } from '@prisma/client';

/**
 * Credenciales por defecto del administrador.
 * Solo se usan en desarrollo cuando no hay variables de entorno configuradas.
 * IMPORTANTE: Nunca usar estas credenciales en producción.
 */
const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@autanasoft.com',
  userName: 'admin',
  password: 'Admin@12345',
} as const;

/**
 * Obtiene los datos del usuario administrador desde variables de entorno
 * o usa valores por defecto para desarrollo.
 *
 * @returns Datos del usuario administrador.
 * @throws Error si se intentan usar credenciales por defecto en producción.
 */
export function getAdminUserData(): Prisma.UserCreateInput {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.APP_ADMIN_EMAIL;
  const adminPassword = process.env.APP_ADMIN_PASSWORD;

  // Validar que en producción se usen variables de entorno
  if (isProduction && (!adminEmail || !adminPassword)) {
    throw new Error(
      'SECURITY ERROR: APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD environment variables are required in production',
    );
  }

  // Validar que no se usen credenciales por defecto en producción
  if (
    isProduction &&
    (adminEmail === DEFAULT_ADMIN_CREDENTIALS.email ||
      adminPassword === DEFAULT_ADMIN_CREDENTIALS.password)
  ) {
    throw new Error(
      'SECURITY ERROR: Default admin credentials cannot be used in production. Please set unique APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD',
    );
  }

  const email = adminEmail || DEFAULT_ADMIN_CREDENTIALS.email;
  const password = adminPassword || DEFAULT_ADMIN_CREDENTIALS.password;

  return {
    email,
    userName: email.split('@')[0], // Extraer username del email
    password,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    emailVerified: new Date(), // Admin pre-verificado
  };
}

/**
 * Genera un mensaje de advertencia con las credenciales del administrador.
 *
 * @param email Email del administrador.
 * @param userName Nombre de usuario del administrador.
 * @param showPassword Si se debe mostrar la contraseña (solo en desarrollo).
 * @returns Mensaje formateado con las credenciales.
 */
export function getAdminCredentialsWarning(
  email: string,
  userName: string,
  showPassword = false,
): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const passwordInfo = showPassword && !isProduction ? `Password: ********\n` : '';

  return `
⚠️  CREDENCIALES DEL ADMINISTRADOR ⚠️
Email:    ${email}
Usuario:  ${userName}
${passwordInfo}
🔒 IMPORTANTE: Cambiar estas credenciales después del primer login en producción.
`;
}
