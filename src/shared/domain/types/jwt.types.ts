import { UserEntity } from '@/modules/users/domain/entities';
import { JwtTempTokenType } from '../enums';

export interface JwtPayload {
  sub: string;
  user: UserEntity;
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
