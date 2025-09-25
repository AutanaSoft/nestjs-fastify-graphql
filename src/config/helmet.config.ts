import { FastifyHelmetOptions } from '@fastify/helmet';
import { registerAs } from '@nestjs/config';

/**
 * Lista de hosts de confianza para desarrollo utilizados en cabeceras de seguridad.
 * @public
 */
export const DEV_TRUSTED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '*.localhost',
  '*.local',
] as const;

/**
 * Orígenes permitidos para las herramientas de Apollo Studio en modo desarrollo.
 * @public
 */
export const APOLLO_STUDIO_ORIGINS = [
  'https://sandbox.embed.apollographql.com',
  'https://studio.apollographql.com',
] as const;

/**
 * Determina si la aplicación se está ejecutando en un entorno productivo.
 * @returns Verdadero cuando `NODE_ENV` es `production`.
 */
function isProduction(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'production';
}

/**
 * Construye una política CSP mínima adecuada para Fastify Helmet según el entorno.
 * @param prod Indica si se ejecuta en producción para endurecer las directivas.
 * @returns Configuración parcial con la política de seguridad de contenidos.
 */
function buildMinimalCsp(
  prod: boolean,
): Pick<FastifyHelmetOptions, 'contentSecurityPolicy'> {
  const allowDev = !prod;
  const httpsTrustedHosts = DEV_TRUSTED_HOSTS.map((h) => `https://${h}`);
  const extraCorsOrigins = resolveCorsAllowedOriginsForCsp();

  const unifiedHttpsOrigins = Array.from(
    new Set<string>([...httpsTrustedHosts, ...extraCorsOrigins]),
  );
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          ...(allowDev
            ? ["'unsafe-inline'", "'unsafe-eval'", ...unifiedHttpsOrigins]
            : []),
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          ...(allowDev ? unifiedHttpsOrigins : []),
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          ...(allowDev ? unifiedHttpsOrigins : []),
        ],
        connectSrc: [
          "'self'",
          ...(allowDev ? ['ws:', 'wss:', ...unifiedHttpsOrigins] : []),
        ],
        fontSrc: ["'self'", 'data:', ...(allowDev ? unifiedHttpsOrigins : [])],
        objectSrc: ["'none'"],
        frameAncestors: allowDev
          ? ["'self'", ...APOLLO_STUDIO_ORIGINS]
          : ["'none'"],
        frameSrc: allowDev ? ["'self'", ...APOLLO_STUDIO_ORIGINS] : ["'none'"],
      },
      reportOnly: allowDev,
    },
  };
}

/**
 * Obtiene los orígenes adicionales permitidos en HTTPS desde `CORS_ALLOWED_ORIGINS`.
 * @returns Conjunto sin duplicados de orígenes válidos convertidos a HTTPS.
 */
function resolveCorsAllowedOriginsForCsp(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS || '';
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
        .map((o) =>
          o.startsWith('http://') ? o.replace('http://', 'https://') : o,
        )
        .filter((o) => o.startsWith('https://')),
    ),
  );
}

/**
 * Crea la configuración completa de Helmet ajustada al entorno actual.
 * @param prod Indica si se debe aplicar configuración endurecida para producción.
 * @returns Opciones compatibles con `@fastify/helmet`.
 */
function createHelmetOptions(prod: boolean): FastifyHelmetOptions {
  const { contentSecurityPolicy } = buildMinimalCsp(prod);
  return {
    contentSecurityPolicy,
    strictTransportSecurity: prod
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    dnsPrefetchControl: { allow: false },
    xssFilter: true,
  };
}

/**
 * Registra la configuración de Helmet bajo el espacio de nombres `helmetConfig`.
 * @returns Opciones de Helmet listas para inyectarse en el módulo HTTP.
 */
export default registerAs('helmetConfig', (): FastifyHelmetOptions => {
  const prod = isProduction();
  return createHelmetOptions(prod);
});
