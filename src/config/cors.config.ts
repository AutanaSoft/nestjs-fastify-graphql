import { FastifyCorsOptions } from '@fastify/cors';
import { type CorsOptions as CorsConfig } from '@nestjs/common/interfaces/external/cors-options.interface';
import { registerAs } from '@nestjs/config';

const isDevelopment = process.env.NODE_ENV !== 'production';

/* const devOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:4200',
  'https://studio.apollographql.com',
  'https://sandbox.embed.apollographql.com',
];
 */
const origins: string[] = [];

const methods = 'GET,HEAD,PUT,PATCH,POST,DELETE';

const allowedHeaders: string[] = [
  'Content-Type',
  'Authorization',
  'Accept',
  'Origin',
  'X-Requested-With',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
  'apollo-require-preflight',
];

const exposedHeaders: string[] = ['X-Total-Count', 'X-Page-Count', 'X-Current-Page', 'X-Per-Page'];

const CorsConfig: FastifyCorsOptions = {
  origin: isDevelopment ? false : origins,
  methods: isDevelopment ? undefined : methods,
  allowedHeaders: isDevelopment ? undefined : allowedHeaders,
  exposedHeaders: isDevelopment ? undefined : exposedHeaders,
  credentials: process.env.CORS_CREDENTIALS === 'true' || false,
  maxAge: isDevelopment ? 86400 : 3600,
};

export { CorsConfig };

export default registerAs('corsConfig', (): FastifyCorsOptions => CorsConfig);
