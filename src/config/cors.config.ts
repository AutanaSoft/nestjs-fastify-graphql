import { FastifyCorsOptions } from '@fastify/cors';
import { registerAs } from '@nestjs/config';

/**
 * Configuración de CORS para Fastify.
 * Define los orígenes permitidos, métodos HTTP, encabezados y otras
 * opciones de seguridad para las solicitudes entre orígenes.
 */
export type CorsConfig = FastifyCorsOptions;

const ALLOWED_HEADERS: string[] = [
  'Content-Type',
  'Authorization',
  'Accept',
  'Origin',
  'X-Requested-With',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
  'apollo-require-preflight',
];

const EXPOSED_HEADERS: string[] = ['X-Total-Count', 'X-Page-Count', 'X-Current-Page', 'X-Per-Page'];

/**
 * Obtiene la lista de orígenes permitidos para CORS en producción.
 * Lee la variable de entorno CORS_ALLOWED_ORIGINS, separa por comas
 * y filtra valores vacíos.
 *
 * @returns Array de URLs de orígenes permitidos
 */
function getProdAllowedOrigins(): string[] {
  const originsEnv = process.env.CORS_ALLOWED_ORIGINS || '';
  return originsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Obtiene la lista de métodos HTTP permitidos para CORS.
 * Lee la variable de entorno CORS_ALLOWED_METHODS, separa por comas
 * y filtra valores vacíos. Si no está definida, usa métodos por defecto.
 *
 * @returns Array de métodos HTTP permitidos
 */
function getAllowedMethods(): string[] {
  const methodsEnv = process.env.CORS_ALLOWED_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
  return methodsEnv
    .split(',')
    .map((method) => method.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Crea la configuración de CORS para Fastify basada en el entorno.
 * En desarrollo permite todos los orígenes. En producción solo permite
 * los orígenes definidos en CORS_ALLOWED_ORIGINS.
 *
 * @remarks
 * Variables de entorno utilizadas:
 * - NODE_ENV: Determina si está en desarrollo o producción
 * - CORS_ALLOWED_ORIGINS: Lista separada por comas de orígenes permitidos
 * - CORS_ALLOWED_METHODS: Lista separada por comas de métodos HTTP permitidos
 * - CORS_CREDENTIALS: Si permite credenciales (default: true)
 *
 * @returns Configuración de CORS para Fastify
 */
export const corsConfigFactory = (): FastifyCorsOptions => {
  {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const prodOrigins = getProdAllowedOrigins();
    const allowedMethods = getAllowedMethods();

    return {
      origin: isDevelopment ? true : prodOrigins.length > 0 ? prodOrigins : false,
      methods: allowedMethods,
      allowedHeaders: ALLOWED_HEADERS,
      exposedHeaders: EXPOSED_HEADERS,
      credentials: process.env.CORS_CREDENTIALS !== 'false',
      maxAge: isDevelopment ? 86400 : 3600,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }
};

export default registerAs('corsConfig', (): FastifyCorsOptions => corsConfigFactory());
