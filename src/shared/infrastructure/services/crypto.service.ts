import { cryptoConfig } from '@/config';
import { DecryptionError, EncryptionError } from '@/shared/domain/errors';
import { decryptWithKey, deriveKey, encryptWithKey, hash } from '@/shared/infrastructure/utils';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Servicio de criptografía para operaciones de cifrado, descifrado y hash.
 *
 * Proporciona métodos seguros para proteger datos sensibles mediante cifrado
 * AES-256-GCM y hash SHA-256. Utiliza derivación de claves con scrypt para
 * mejorar la seguridad. El servicio deriva la clave de cifrado una vez durante
 * la inicialización para optimizar el rendimiento.
 *
 * @public
 */
@Injectable()
export class CryptoService {
  private readonly derivedKey: Buffer;

  constructor(
    @Inject(cryptoConfig.KEY)
    private readonly config: ConfigType<typeof cryptoConfig>,
    @InjectPinoLogger(CryptoService.name)
    private readonly logger: PinoLogger,
  ) {
    this.derivedKey = deriveKey(this.config.secret, this.config.salt, this.config.keyLength);
    this.logger.info('CryptoService initialized with derived encryption key');
  }

  /**
   * Cifra un texto utilizando AES-256-GCM con autenticación.
   *
   * El texto cifrado resultante incluye el vector de inicialización (IV) y
   * el tag de autenticación para verificar la integridad de los datos.
   *
   * @param text - Texto plano a cifrar
   * @returns Texto cifrado en formato "iv.encrypted.authTag" (hexadecimal)
   * @throws EncryptionError si el cifrado falla
   * @remarks
   * - El IV es generado aleatoriamente para cada operación
   * - El formato de salida incluye IV, datos cifrados y tag de autenticación
   * - El algoritmo AES-256-GCM proporciona confidencialidad y autenticación
   */
  encrypt(text: string): string {
    this.logger.debug({ method: 'encrypt' });

    try {
      const encrypted = encryptWithKey(
        text,
        this.derivedKey,
        this.config.algorithm,
        this.config.ivLength,
      );

      this.logger.debug('Data encrypted successfully');
      return encrypted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: errorMessage, method: 'encrypt' }, 'Encryption failed');
      throw new EncryptionError(`Encryption operation failed: ${errorMessage}`);
    }
  }

  /**
   * Descifra un texto cifrado previamente con el método encrypt.
   *
   * Verifica la integridad de los datos mediante el tag de autenticación
   * incluido en el texto cifrado.
   *
   * @param encryptedData - Texto cifrado en formato "iv.encrypted.authTag"
   * @returns Texto plano original
   * @throws DecryptionError si el descifrado falla o los datos están corruptos
   * @remarks
   * - El formato de entrada debe ser "iv.encrypted.authTag" en hexadecimal
   * - El tag de autenticación garantiza que los datos no han sido modificados
   * - Si la verificación del tag falla, se lanza DecryptionError
   */
  decrypt(encryptedData: string): string {
    this.logger.debug({ method: 'decrypt' });

    try {
      const decrypted = decryptWithKey(encryptedData, this.derivedKey, this.config.algorithm);

      this.logger.debug('Data decrypted successfully');
      return decrypted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: errorMessage, method: 'decrypt' }, 'Decryption failed');
      throw new DecryptionError(`Decryption operation failed: ${errorMessage}`);
    }
  }

  /**
   * Genera un hash SHA-256 determinístico de un texto.
   *
   * Útil para almacenar identificadores sensibles, tokens opacos o verificar
   * integridad de datos sin necesidad de descifrado posterior.
   *
   * @param text - Texto a hashear
   * @returns Hash SHA-256 en hexadecimal (64 caracteres)
   * @remarks
   * - El hash es determinístico: mismo input produce mismo output
   * - El hash es irreversible: no se puede obtener el texto original
   * - Ideal para refresh tokens, comparaciones de datos sensibles
   * - NO usar para contraseñas (usar bcrypt/argon2 en su lugar)
   */
  hash(text: string): string {
    this.logger.debug({ method: 'hash' });

    try {
      const hashed = hash(text);
      this.logger.debug('Data hashed successfully');
      return hashed;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: errorMessage, method: 'hash' }, 'Hashing failed');
      throw new Error(`Hashing operation failed: ${errorMessage}`);
    }
  }
}
