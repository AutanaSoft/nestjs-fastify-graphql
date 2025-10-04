import { isEmail } from 'class-validator';
import { FORBIDDEN_EMAIL_DOMAINS } from '../constants';
import { ForbiddenEmailDomainError, UserCreationError } from '../errors';

/**
 * Value Object que encapsula y valida un email de usuario.
 *
 * Garantiza que el email cumpla con reglas de formato (sintaxis válida, longitud)
 * y reglas de negocio (dominio no esté en lista de prohibidos).
 * El valor se normaliza automáticamente a minúsculas y sin espacios.
 *
 * @public
 * @remarks
 * El email debe cumplir con:
 * - Formato de email válido según RFC 5322
 * - Longitud máxima de 64 caracteres
 * - Dominio no estar en la lista de dominios prohibidos
 * - Se normaliza automáticamente a minúsculas
 *
 * @example
 * ```typescript
 * const email = new UserEmail('john.doe@example.com');
 * console.log(email.getValue()); // "john.doe@example.com"
 * ```
 */
export class UserEmail {
  private readonly MAX_LENGTH = 64;
  private readonly value: string;

  /**
   * Crea una nueva instancia de UserEmail.
   *
   * @param value Email de usuario a validar y normalizar.
   * @throws UserCreationError Si el formato no es válido (vacío, longitud incorrecta, sintaxis inválida).
   * @throws ForbiddenEmailDomainError Si el dominio está en la lista de dominios prohibidos.
   * @remarks El valor será normalizado (trim y toLowerCase) antes de ser almacenado.
   */
  constructor(value: string) {
    this.validateFormat(value);
    this.validateBusinessRules(value);
    this.value = value.trim().toLowerCase();
  }

  /**
   * Valida el formato técnico del email.
   *
   * Verifica que el email cumpla con los siguientes requisitos:
   * - No esté vacío o sea solo espacios en blanco
   * - No exceda 64 caracteres de longitud
   * - Tenga formato de email válido según RFC 5322
   *
   * @param value Valor a validar.
   * @throws UserCreationError Si alguna validación de formato falla con un mensaje descriptivo.
   * @private
   */
  private validateFormat(value: string): void {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue || normalizedValue.length === 0) {
      throw new UserCreationError('Email is required.');
    }

    if (normalizedValue.length > this.MAX_LENGTH) {
      throw new UserCreationError(`Email must be at most ${this.MAX_LENGTH} characters long.`);
    }

    if (!isEmail(normalizedValue)) {
      throw new UserCreationError('Email must be a valid email address.');
    }
  }

  /**
   * Valida las reglas de negocio del email.
   *
   * Verifica que el dominio del email no esté en la lista de dominios prohibidos
   * definida en las constantes del dominio. La validación se realiza de forma
   * case-insensitive sobre el dominio extraído.
   *
   * @param value Valor a validar.
   * @throws ForbiddenEmailDomainError Si el dominio está en la lista de dominios prohibidos.
   * @private
   * @see FORBIDDEN_EMAIL_DOMAINS
   */
  private validateBusinessRules(value: string): void {
    const normalizedValue = value.trim().toLowerCase();
    const domain = this.extractDomain(normalizedValue);
    if (FORBIDDEN_EMAIL_DOMAINS.includes(domain)) {
      throw new ForbiddenEmailDomainError(value, domain);
    }
  }

  /**
   * Extrae el dominio de una dirección de email.
   *
   * Separa la dirección de email por el carácter '@' y retorna la parte
   * correspondiente al dominio (después del @).
   *
   * @param email Dirección de email del cual extraer el dominio.
   * @returns El dominio del email, o una cadena vacía si el formato es inválido.
   * @private
   * @example
   * extractDomain('user@example.com') // returns 'example.com'
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : '';
  }

  /**
   * Obtiene el valor normalizado del email.
   *
   * El valor retornado está normalizado en minúsculas y sin espacios en blanco
   * al inicio o final, garantizando consistencia en comparaciones y almacenamiento.
   *
   * @returns El email validado y normalizado en minúsculas.
   * @public
   */
  getValue(): string {
    return this.value;
  }
}
