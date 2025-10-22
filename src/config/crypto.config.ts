import { registerAs } from '@nestjs/config';

/**
 * Configuración del sistema de criptografía.
 *
 * Define los parámetros necesarios para cifrado/descifrado AES-256-GCM
 * y derivación de claves con scrypt.
 *
 * @public
 */
export type CryptoConfig = {
  /**
   * Secreto principal para derivación de claves.
   * Debe tener al menos 32 caracteres.
   *
   * @remarks
   * Este valor debe ser único por entorno y nunca debe ser commiteado.
   * Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   */
  readonly secret: string;

  /**
   * Salt para derivación de clave con scrypt.
   * Debe tener al menos 16 caracteres.
   *
   * @remarks
   * Este valor debe ser único por entorno y nunca debe ser commiteado.
   * Generar con: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
   */
  readonly salt: string;

  /**
   * Algoritmo de cifrado utilizado.
   * Por defecto: AES-256-GCM (Galois/Counter Mode).
   */
  readonly algorithm: string;

  /**
   * Longitud del vector de inicialización (IV) en bytes.
   * Por defecto: 16 bytes para AES-256-GCM.
   */
  readonly ivLength: number;

  /**
   * Longitud de la clave de cifrado en bytes.
   * Por defecto: 32 bytes para AES-256.
   */
  readonly keyLength: number;
};

/**
 * Factory de configuración de criptografía.
 *
 * Carga y valida las variables de entorno necesarias para el sistema de cifrado.
 *
 * @returns Configuración de criptografía validada
 * @throws Error si las variables de entorno no están configuradas correctamente
 *
 * @public
 */
export default registerAs('crypto', (): CryptoConfig => {
  const secret = process.env.ENCRYPTION_SECRET;
  const salt = process.env.ENCRYPTION_SALT;

  if (!secret) {
    throw new Error(
      "ENCRYPTION_SECRET is not defined. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  if (secret.length < 32) {
    throw new Error('ENCRYPTION_SECRET must be at least 32 characters long');
  }

  if (!salt) {
    throw new Error(
      "ENCRYPTION_SALT is not defined. Generate one with: node -e \"console.log(require('crypto').randomBytes(16).toString('hex'))\"",
    );
  }

  if (salt.length < 16) {
    throw new Error('ENCRYPTION_SALT must be at least 16 characters long');
  }

  return {
    secret,
    salt,
    algorithm: 'aes-256-gcm',
    ivLength: 16,
    keyLength: 32,
  };
});
