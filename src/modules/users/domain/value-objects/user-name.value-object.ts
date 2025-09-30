import { FORBIDDEN_USER_NAMES } from '../constants';
import { ForbiddenUserNameError } from '../errors';

/**
 * Value Object que encapsula y valida un nombre de usuario.
 *
 * Garantiza que el nombre no esté en la lista de nombres prohibidos
 * y proporciona una representación inmutable del valor.
 *
 * @public
 */
export class UserName {
  private readonly value: string;

  /**
   * Crea una nueva instancia de UserName.
   *
   * @param value Nombre de usuario a validar.
   * @throws ForbiddenUserNameError Si el nombre está en la lista de prohibidos.
   */
  constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  /**
   * Valida que el nombre de usuario no esté prohibido.
   *
   * @param value Nombre a validar.
   * @throws ForbiddenUserNameError Si el nombre está prohibido.
   */
  private validate(value: string): void {
    const normalizedValue = value.toLowerCase().trim();
    if (FORBIDDEN_USER_NAMES.includes(normalizedValue)) {
      throw new ForbiddenUserNameError(value);
    }
  }

  /**
   * Obtiene el valor del nombre de usuario.
   *
   * @returns El nombre de usuario validado.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara este UserName con otro para verificar igualdad.
   *
   * @param other Otro UserName a comparar.
   * @returns true si son iguales, false en caso contrario.
   */
  equals(other: UserName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * Retorna la representación en string del nombre de usuario.
   *
   * @returns El valor del nombre de usuario.
   */
  toString(): string {
    return this.value;
  }
}
