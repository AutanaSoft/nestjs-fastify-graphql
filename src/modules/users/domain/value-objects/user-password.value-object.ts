import { UserCreationError } from '../errors';

/**
 * Value Object que encapsula y valida una contraseña de usuario.
 *
 * Garantiza que la contraseña cumpla con reglas de formato (longitud, complejidad)
 * y proporciona una representación inmutable del valor.
 * El valor se normaliza automáticamente eliminando espacios al inicio y final.
 *
 * @public
 * @remarks
 * La contraseña debe cumplir con:
 * - Longitud entre 8 y 64 caracteres
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos una letra minúscula (a-z)
 * - Al menos un dígito (0-9)
 * - Al menos un carácter especial (@$!%*?&)
 *
 * @example
 * ```typescript
 * const password = new UserPassword('MyP@ssw0rd');
 * console.log(password.getValue()); // "MyP@ssw0rd"
 * ```
 */
export class UserPassword {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 64;
  private static readonly PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

  private readonly value: string;

  /**
   * Crea una nueva instancia de UserPassword.
   *
   * @param value Contraseña de usuario a validar y normalizar.
   * @throws UserCreationError Si el formato no es válido (vacío, longitud incorrecta, complejidad insuficiente).
   * @remarks El valor será normalizado (trim) antes de ser almacenado.
   */
  constructor(value: string) {
    this.validateFormat(value);
    this.value = value.trim();
  }

  /**
   * Valida el formato técnico de la contraseña.
   *
   * Verifica que la contraseña cumpla con los siguientes requisitos:
   * - No esté vacía o sea solo espacios en blanco
   * - Tenga al menos 8 caracteres
   * - No exceda 64 caracteres
   * - Contenga al menos una letra mayúscula
   * - Contenga al menos una letra minúscula
   * - Contenga al menos un dígito
   * - Contenga al menos un carácter especial (@$!%*?&)
   *
   * @param value Valor a validar.
   * @throws UserCreationError Si alguna validación de formato falla con un mensaje descriptivo.
   * @private
   */
  private validateFormat(value: string): void {
    const trimmedValue = value.trim();

    // Validar que la contraseña no esté vacía
    if (!trimmedValue || trimmedValue.length === 0) {
      throw new UserCreationError('Password is required');
    }

    // Validar longitud mínima
    if (trimmedValue.length < UserPassword.MIN_LENGTH) {
      throw new UserCreationError(
        `Password must be at least ${UserPassword.MIN_LENGTH} characters long`,
      );
    }

    // Validar longitud máxima
    if (trimmedValue.length > UserPassword.MAX_LENGTH) {
      throw new UserCreationError(
        `Password must be at most ${UserPassword.MAX_LENGTH} characters long`,
      );
    }

    // Validar complejidad de la contraseña
    if (!UserPassword.PASSWORD_REGEX.test(trimmedValue)) {
      throw new UserCreationError(
        'Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
      );
    }
  }

  /**
   * Obtiene el valor de la contraseña.
   *
   * @returns La contraseña validada y normalizada.
   * @public
   * @remarks Este método NO debe usarse para comparar contraseñas. Use el método compare() en su lugar.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Verifica si la contraseña es válida sin lanzar excepciones.
   *
   * @param value Contraseña a validar.
   * @returns true si la contraseña es válida, false en caso contrario.
   * @public
   */
  static isValid(value: string): boolean {
    try {
      new UserPassword(value);
      return true;
    } catch {
      return false;
    }
  }
}
