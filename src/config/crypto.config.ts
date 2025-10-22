import { registerAs } from '@nestjs/config';

/**
 * Configuración de criptografía para cifrado y descifrado de datos sensibles.
 *
 * @remarks
 * Esta configuración utiliza el algoritmo AES-256-GCM para proporcionar cifrado
 * autenticado con datos asociados. Todas las propiedades son de solo lectura para
 * garantizar la inmutabilidad de la configuración en tiempo de ejecución.
 *
 * @public
 */
export type CryptoConfig = {
  /**
   * Clave secreta utilizada como base para derivar la clave de cifrado.
   *
   * @remarks
   * Debe tener al menos 32 caracteres de longitud. Se recomienda generar un
   * valor aleatorio de 64 caracteres hexadecimales utilizando el comando:
   * `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   */
  readonly secret: string;

  /**
   * Salt utilizado en la derivación de la clave de cifrado mediante PBKDF2.
   *
   * @remarks
   * Debe tener al menos 16 caracteres de longitud. Se recomienda generar un
   * valor aleatorio de 32 caracteres hexadecimales utilizando el comando:
   * `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
   */
  readonly salt: string;

  /**
   * Algoritmo de cifrado a utilizar.
   *
   * @remarks
   * Valor por defecto: 'aes-256-gcm'. Este algoritmo proporciona cifrado
   * autenticado con integridad de datos incorporada.
   */
  readonly algorithm: string;

  /**
   * Longitud en bytes del vector de inicialización (IV).
   *
   * @remarks
   * Valor por defecto: 16 bytes. El IV es un valor aleatorio que se genera
   * para cada operación de cifrado y garantiza que el mismo texto plano
   * produzca diferentes textos cifrados.
   */
  readonly ivLength: number;

  /**
   * Longitud en bytes de la clave de cifrado derivada.
   *
   * @remarks
   * Valor por defecto: 32 bytes (256 bits). Esta es la longitud requerida
   * para el algoritmo AES-256.
   */
  readonly keyLength: number;
};

/**
 * Factory que construye y valida la configuración de criptografía.
 *
 * @returns Objeto de configuración de criptografía validado y tipado.
 *
 * @throws {Error}
 * Lanza error si ENCRYPTION_SECRET no está definido en las variables de entorno.
 *
 * @throws {Error}
 * Lanza error si ENCRYPTION_SECRET tiene menos de 32 caracteres.
 *
 * @throws {Error}
 * Lanza error si ENCRYPTION_SALT no está definido en las variables de entorno.
 *
 * @throws {Error}
 * Lanza error si ENCRYPTION_SALT tiene menos de 16 caracteres.
 *
 * @remarks
 * Esta función se ejecuta durante el inicio de la aplicación y falla rápidamente
 * si las variables de entorno requeridas no están configuradas correctamente.
 * No proporciona valores por defecto para secret y salt por razones de seguridad.
 * Los valores de algorithm, ivLength y keyLength están codificados para garantizar
 * la consistencia del cifrado en toda la aplicación.
 *
 * @public
 */
export const cryptoConfigFactory = (): CryptoConfig => {
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
};

/**
 * Configuración de criptografía registrada para inyección de dependencias.
 *
 * @remarks
 * Este configurador registrado utiliza el namespace 'crypto' y puede ser
 * inyectado en servicios usando `@Inject(cryptoConfigFactory.KEY)` o
 * accedido mediante `ConfigService.get<CryptoConfig>('crypto')`.
 *
 * @see CryptoConfig
 * @see cryptoConfigFactory
 *
 * @public
 */
export default registerAs('crypto', (): CryptoConfig => cryptoConfigFactory());
