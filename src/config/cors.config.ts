import { FastifyCorsOptions } from '@fastify/cors';
import { registerAs } from '@nestjs/config';

/**
 * Registra la configuración CORS del servidor HTTP basándose en variables de entorno.
 * @remarks
 * En entornos de desarrollo permite cualquier origen y añade dominios locales comunes.
 * En otros entornos únicamente autoriza los orígenes definidos en `CORS_ALLOWED_ORIGINS`.
 * @returns Opciones tipadas compatibles con `@fastify/cors`.
 */
export default registerAs('corsConfig', (): FastifyCorsOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';

  const corsOriginsEnv = process.env.CORS_ALLOWED_ORIGINS || '';
  const extraOrigins = corsOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const devDefaults = isDevelopment
    ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4200',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4200',
        'https://studio.apollographql.com',
        'https://sandbox.embed.apollographql.com',
      ]
    : [];

  const allOrigins = [...devDefaults, ...extraOrigins];

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

  const exposedHeaders: string[] = [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
  ];

  const corsOptions: FastifyCorsOptions = {
    origin: isDevelopment ? true : allOrigins.length > 0 ? allOrigins : false,
    allowedHeaders,
    exposedHeaders,
    credentials: true,
    maxAge: isDevelopment ? 86400 : 3600,
    // preflight and 204 success are handled internally by @fastify/cors
  };

  return corsOptions;
});
