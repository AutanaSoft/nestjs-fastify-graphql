import { FastifyCorsOptions } from '@fastify/cors';
import { registerAs } from '@nestjs/config';

/**
 * Orígenes permitidos para CORS en desarrollo local.
 * @remarks
 * Estos orígenes se permiten automáticamente cuando NODE_ENV no es 'production'.
 * Incluye puertos comunes para aplicaciones frontend y herramientas de Apollo Studio.
 */
export const DEV_CORS_ORIGINS: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4200',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:4200',
  'https://studio.apollographql.com',
  'https://sandbox.embed.apollographql.com',
];

/**
 * Tipo exportado para la configuración de CORS compatible con Fastify.
 * @remarks
 * Útil para inyección de dependencias usando `ConfigType<typeof corsConfig>`.
 */
export type CorsConfig = FastifyCorsOptions;

/**
 * Cabeceras HTTP permitidas en solicitudes CORS.
 * @remarks
 * Incluye cabeceras estándar y la cabecera específica de Apollo Server.
 */
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

/**
 * Cabeceras HTTP expuestas en respuestas CORS.
 * @remarks
 * Estas cabeceras estarán disponibles para el cliente a través de JavaScript.
 * Útiles para paginación y metadatos de respuesta.
 */
const EXPOSED_HEADERS: string[] = ['X-Total-Count', 'X-Page-Count', 'X-Current-Page', 'X-Per-Page'];

/**
 * Obtiene los orígenes permitidos de producción desde variables de entorno.
 * @returns Array de orígenes validados para producción.
 * @remarks
 * Lee desde la variable CORS_ALLOWED_ORIGINS separada por comas.
 */
function getProdAllowedOrigins(): string[] {
  const originsEnv = process.env.CORS_ALLOWED_ORIGINS || '';
  return originsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Crea la configuración completa de CORS para Fastify según el entorno.
 * @returns Opciones de CORS compatibles con @fastify/cors.
 * @remarks
 * En desarrollo permite todos los orígenes de DEV_CORS_ORIGINS.
 * En producción solo permite orígenes definidos en CORS_ALLOWED_ORIGINS.
 * Las credenciales están habilitadas por defecto (configurable vía CORS_CREDENTIALS).
 */
function createCorsConfig(): FastifyCorsOptions {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const prodOrigins = getProdAllowedOrigins();

  return {
    origin: isDevelopment ? true : prodOrigins.length > 0 ? prodOrigins : false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    credentials: process.env.CORS_CREDENTIALS !== 'false',
    maxAge: isDevelopment ? 86400 : 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}

/**
 * Instancia pre-configurada de opciones de CORS para Fastify.
 * @remarks
 * Exportación lista para usar directamente sin necesidad de llamar a createCorsConfig().
 * La configuración se adapta automáticamente según el entorno (desarrollo/producción).
 */
export const CorsConfig: FastifyCorsOptions = createCorsConfig();

export default registerAs('corsConfig', (): FastifyCorsOptions => CorsConfig);
