import { FORBIDDEN_EMAIL_DOMAINS } from '../constants';
import { ForbiddenEmailDomainError } from '../errors';

/**
 * Value Object que encapsula y valida un email de usuario.
 *
 * Garantiza que el dominio del email no esté en la lista de dominios
 * prohibidos y proporciona una representación inmutable del valor.
 *
 * @public
 */
export class UserEmail {
  private readonly value: string;

  /**
   * Crea una nueva instancia de UserEmail.
   *
   * @param value Email de usuario a validar.
   * @throws ForbiddenEmailDomainError Si el dominio está en la lista de prohibidos.
   */
  constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  /**
   * Valida que el dominio del email no esté prohibido.
   *
   * @param value Email a validar.
   * @throws ForbiddenEmailDomainError Si el dominio está prohibido.
   */
  private validate(value: string): void {
    const domain = this.extractDomain(value);
    const normalizedDomain = domain.toLowerCase().trim();
    if (FORBIDDEN_EMAIL_DOMAINS.includes(normalizedDomain)) {
      throw new ForbiddenEmailDomainError(value, domain);
    }
  }

  /**
   * Extrae el dominio de un email.
   *
   * @param email Email del cual extraer el dominio.
   * @returns El dominio del email.
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : '';
  }

  /**
   * Obtiene el valor del email de usuario.
   *
   * @returns El email de usuario validado.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara este UserEmail con otro para verificar igualdad.
   *
   * @param other Otro UserEmail a comparar.
   * @returns true si son iguales, false en caso contrario.
   */
  equals(other: UserEmail): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * Retorna la representación en string del email de usuario.
   *
   * @returns El valor del email de usuario.
   */
  toString(): string {
    return this.value;
  }
}
