import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export type JwtConfigType = {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
  tempTokens: {
    forgotPassword: string;
    resetPassword: string;
    refreshToken: string;
  };
};

export const JwtConfig: JwtConfigType = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'nestjs-auth-api',
  audience: process.env.JWT_AUDIENCE || 'nestjs-auth-client',
  tempTokens: {
    forgotPassword: process.env.JWT_TEMP_TOKEN_FORGOT_PASSWORD || '15m',
    resetPassword: process.env.JWT_TEMP_TOKEN_RESET_PASSWORD || '15m',
    refreshToken: process.env.JWT_TEMP_TOKEN_REFRESH_TOKEN || '7d',
  },
};

export const createJwtModuleOptions = (config: JwtConfigType): JwtModuleOptions => ({
  secret: config.secret,
  signOptions: {
    expiresIn: config.expiresIn as never,
    issuer: config.issuer,
    audience: config.audience,
  },
  verifyOptions: {
    issuer: config.issuer,
    audience: config.audience,
  },
});

export default registerAs('jwt', (): JwtConfigType => JwtConfig);
