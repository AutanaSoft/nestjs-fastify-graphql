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
