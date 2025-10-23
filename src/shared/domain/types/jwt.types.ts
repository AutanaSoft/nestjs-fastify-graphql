import { UserEntityData } from '@/modules/users/domain/entities';
import { JwtTempTokenType } from '../enums';

/**
 * Tipo que representa un usuario sin información sensible para el JWT.
 *
 * Omite el password por razones de seguridad en el payload del token.
 */
export type JwtUserPayload = Omit<UserEntityData, 'password'>;

export interface JwtPayload {
  sub: string;
  user: JwtUserPayload;
  iat?: number;
  exp?: number;
}

export interface TempTokenPayload extends JwtPayload {
  sub: string;
  type: JwtTempTokenType;
}

/**
 * Resultado de la generación de un token JWT.
 *
 * Contiene el token generado junto con metadata temporal
 * para facilitar el manejo en los casos de uso.
 *
 * @public
 */
export interface JwtTokenResult {
  /** Token JWT generado y firmado */
  readonly token: string;
  /** Fecha en que se creó el token */
  readonly createdAt: Date;
  /** Fecha en que expira el token */
  readonly expiredAt: Date;
}
