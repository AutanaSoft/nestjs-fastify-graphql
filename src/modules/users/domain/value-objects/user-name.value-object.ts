import { FORBIDDEN_USER_NAMES } from '../constants';
import { ForbiddenUserNameError, UserCreationError } from '../errors';

/**
 * Value Object que encapsula y valida un nombre de usuario.
 *
 * Garantiza que el nombre cumpla con reglas de formato (longitud, caracteres permitidos,
 * estructura) y reglas de negocio (no estar en lista de nombres prohibidos ni contener
 * palabras prohibidas como subcadenas).
 * El valor se normaliza automáticamente eliminando espacios al inicio y final.
 *
 * @public
 * @remarks
 * El nombre de usuario debe cumplir con:
 * - Longitud entre 3 y 20 caracteres
 * - Iniciar con una letra (A-Z o a-z)
 * - Contener solo letras, números, puntos (.), guiones bajos (_) o guiones (-)
 * - No estar en la lista de nombres prohibidos (coincidencia exacta)
 * - No contener palabras prohibidas como subcadenas (ej: 'admin123' contiene 'admin')
 */
export class UserName {
  private readonly MIN_LENGTH = 3;
  private readonly MAX_LENGTH = 20;
  private readonly STARTS_WITH_LETTER_REGEX = /^[A-Za-z].*$/;
  private readonly ALLOWED_CHARACTERS_REGEX = /^[A-Za-z0-9._-]+$/;
  private readonly value: string;

  /**
   * Crea una nueva instancia de UserName.
   *
   * @param value Nombre de usuario a validar y normalizar.
   * @throws UserCreationError Si el formato no es válido (vacío, longitud incorrecta, caracteres no permitidos, etc.).
   * @throws ForbiddenUserNameError Si el nombre está en la lista de nombres prohibidos.
   * @remarks El valor será normalizado (trim) antes de ser almacenado.
   */
  constructor(value: string) {
    this.validateFormat(value);
    this.validateBusinessRules(value);
    this.value = value;
  }

  /**
   * Valida el formato técnico del nombre de usuario.
   *
   * Verifica que el nombre cumpla con los siguientes requisitos:
   * - No esté vacío o sea solo espacios en blanco
   * - Tenga al menos 3 caracteres
   * - No exceda 20 caracteres
   * - Inicie con una letra (A-Z o a-z)
   * - Contenga solo letras, números, puntos (.), guiones bajos (_) o guiones (-)
   *
   * @param value Valor a validar.
   * @throws UserCreationError Si alguna validación de formato falla con un mensaje descriptivo.
   * @private
   */
  private validateFormat(value: string): void {
    const trimmedValue = value.trim();
    // validate that the username is not empty or just whitespace
    if (!trimmedValue || trimmedValue.length === 0) {
      throw new UserCreationError('UserName is required.');
    }

    // validate that the username minimum length is 3
    if (trimmedValue.length < this.MIN_LENGTH) {
      throw new UserCreationError(`UserName must be at least ${this.MIN_LENGTH} characters long.`);
    }

    // validate that the username maximum length is 20
    if (trimmedValue.length > this.MAX_LENGTH) {
      throw new UserCreationError(`UserName must be at most ${this.MAX_LENGTH} characters long`);
    }

    // validate that the username starts with a letter
    const formatRegex = this.STARTS_WITH_LETTER_REGEX;
    if (!formatRegex.test(trimmedValue)) {
      throw new UserCreationError('UserName must start with a letter (A-Z or a-z).');
    }

    // validate that the username contains only letters, numbers, dots, underscores or hyphens
    if (!this.ALLOWED_CHARACTERS_REGEX.test(trimmedValue)) {
      throw new UserCreationError(
        'UserName can include only letters, numbers, dots (.), underscores (_) or hyphens (-).',
      );
    }
  }

  /**
   * Valida las reglas de negocio del nombre de usuario.
   *
   * Verifica que el nombre no contenga palabras prohibidas como subcadenas.
   * La validación se realiza de forma case-insensitive y cubre tanto coincidencias
   * exactas como subcadenas.
   *
   * @param value Valor a validar.
   * @throws ForbiddenUserNameError Si el nombre contiene alguna palabra prohibida.
   * @private
   * @see FORBIDDEN_USER_NAMES
   * @remarks
   * Ejemplos de nombres bloqueados:
   * - 'admin' (coincidencia exacta)
   * - 'superAdmin' (contiene 'admin')
   * - 'admin123' (contiene 'admin')
   * - 'root_user' (contiene 'root')
   */
  private validateBusinessRules(value: string): void {
    const normalizedValue = value.toLowerCase().trim();

    // Validación de subcadenas prohibidas (incluye coincidencias exactas)
    const containsForbiddenWord = FORBIDDEN_USER_NAMES.some((forbiddenName) =>
      normalizedValue.includes(forbiddenName),
    );

    if (containsForbiddenWord) {
      throw new ForbiddenUserNameError(value);
    }
  }

  /**
   * Obtiene el valor normalizado del nombre de usuario.
   *
   * @returns El nombre de usuario validado, normalizado y sin espacios al inicio/final.
   * @public
   */
  getValue(): string {
    return this.value.trim();
  }
}
