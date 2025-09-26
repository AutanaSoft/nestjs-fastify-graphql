import bcrypt from 'bcryptjs';

/**
 * Utilidades para operaciones criptográficas de contraseñas.
 * @public
 */
export class HashUtils {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Genera un hash seguro para la contraseña proporcionada.
   * @param password Contraseña en texto plano.
   * @returns Hash generado con el algoritmo de bcrypt.
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verifica si la contraseña coincide con el hash almacenado.
   * @param password Contraseña en texto plano a validar.
   * @param hash Hash previamente generado.
   * @returns Verdadero cuando la contraseña es válida.
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
