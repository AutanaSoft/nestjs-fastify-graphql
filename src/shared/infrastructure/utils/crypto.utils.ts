import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  type CipherGCM,
  type DecipherGCM,
} from 'node:crypto';

/**
 * Deriva una clave de cifrado usando scrypt.
 *
 * Utiliza el algoritmo scrypt para derivar una clave segura desde un secreto y un salt.
 * Este proceso es computacionalmente costoso, lo que lo hace resistente a ataques de fuerza bruta.
 *
 * @param secret - Secreto principal (debe tener al menos 32 caracteres)
 * @param salt - Salt para la derivación (debe tener al menos 16 caracteres)
 * @param keyLength - Longitud de la clave derivada en bytes (por defecto 32 para AES-256)
 * @returns Buffer con la clave derivada
 *
 * @remarks
 * Esta función debe ser llamada una sola vez durante la inicialización del servicio
 * para evitar el overhead computacional en cada operación de cifrado.
 *
 * @public
 */
export function deriveKey(secret: string, salt: string, keyLength = 32): Buffer {
  const saltBuffer = Buffer.from(salt, 'utf8');
  return scryptSync(secret, saltBuffer, keyLength);
}

/**
 * Cifra un texto usando AES-256-GCM con una clave proporcionada.
 *
 * AES-256-GCM proporciona cifrado autenticado, lo que significa que además de
 * confidencialidad, garantiza integridad y autenticidad de los datos.
 *
 * @param text - Texto plano a cifrar
 * @param key - Clave de cifrado (debe ser de 32 bytes para AES-256)
 * @param algorithm - Algoritmo de cifrado (por defecto 'aes-256-gcm')
 * @param ivLength - Longitud del vector de inicialización en bytes (por defecto 16)
 * @returns Texto cifrado en formato: `iv.encrypted.authTag` (todo en hexadecimal)
 *
 * @remarks
 * El formato de salida incluye tres componentes separados por puntos:
 * - IV (Initialization Vector): Aleatorio, asegura que el mismo texto produzca cifrados diferentes
 * - Texto cifrado: Los datos cifrados
 * - AuthTag: Tag de autenticación para verificar integridad
 *
 * @example
 * ```typescript
 * const key = deriveKey('my-secret', 'my-salt');
 * const encrypted = encryptWithKey('sensitive-email@example.com', key);
 * // Resultado: "a1b2c3d4e5f6...".
 * ```
 *
 * @public
 */
export function encryptWithKey(
  text: string,
  key: Buffer,
  algorithm = 'aes-256-gcm',
  ivLength = 16,
): string {
  // Generar IV aleatorio para cada cifrado
  const iv: Buffer = randomBytes(ivLength);

  // Crear cipher con el algoritmo, clave e IV
  const cipher = createCipheriv(algorithm, key, iv) as CipherGCM;

  // Cifrar el texto
  let encrypted: string = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Obtener el authentication tag (solo disponible después de final())
  const authTag: Buffer = cipher.getAuthTag();

  // Retornar en formato: iv.encrypted.authTag
  return [iv.toString('hex'), encrypted, authTag.toString('hex')].join('.');
}

/**
 * Descifra un texto cifrado con AES-256-GCM usando una clave proporcionada.
 *
 * Verifica la integridad y autenticidad de los datos usando el authentication tag
 * antes de descifrar. Si el tag no coincide, lanza un error.
 *
 * @param encryptedData - Texto cifrado en formato: `iv.encrypted.authTag`
 * @param key - Clave de cifrado (debe ser la misma usada para cifrar)
 * @param algorithm - Algoritmo de cifrado (por defecto 'aes-256-gcm')
 * @returns Texto plano descifrado
 * @throws Error si el formato de datos cifrados es inválido
 * @throws Error si el authentication tag no coincide (datos manipulados)
 *
 * @example
 * ```typescript
 * const key = deriveKey('my-secret', 'my-salt');
 * const decrypted = decryptWithKey('a1b2c3d4e5f6...', key);
 * // Resultado: "sensitive-email@example.com"
 * ```
 *
 * @public
 */
export function decryptWithKey(
  encryptedData: string,
  key: Buffer,
  algorithm = 'aes-256-gcm',
): string {
  // Separar los componentes del dato cifrado
  const parts: string[] = encryptedData.split('.');

  if (parts.length !== 3) {
    throw new Error(
      `Invalid encrypted data format. Expected format: iv.encrypted.authTag, got ${parts.length} parts`,
    );
  }

  // Extraer IV, datos cifrados y authTag
  const iv: Buffer = Buffer.from(parts[0], 'hex');
  const encrypted: string = parts[1];
  const authTag: Buffer = Buffer.from(parts[2], 'hex');

  // Crear decipher con el algoritmo, clave e IV
  const decipher = createDecipheriv(algorithm, key, iv) as DecipherGCM;

  // Configurar el authentication tag para verificación
  decipher.setAuthTag(authTag);

  // Descifrar el texto
  let decrypted: string = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Genera un hash SHA-256 de un texto.
 *
 * Este hash es determinista (mismo input = mismo output) y unidireccional
 * (no se puede revertir). Es útil para detectar duplicados sin exponer
 * el texto original.
 *
 * @param text - Texto a hashear (por ejemplo: email, teléfono)
 * @returns Hash SHA-256 en formato hexadecimal (64 caracteres)
 *
 * @remarks
 * El hash SHA-256 es perfecto para:
 * - Crear índices únicos en base de datos sin exponer datos sensibles
 * - Detectar duplicados de forma eficiente
 * - Búsquedas rápidas sin revelar el valor original
 *
 * @example
 * ```typescript
 * const emailHash = hash('user@example.com');
 * // Resultado: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
 *
 * // Guardar en DB para búsquedas sin exponer el email
 * await db.user.findUnique({ where: { emailHash } });
 * ```
 *
 * @public
 */
export function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
