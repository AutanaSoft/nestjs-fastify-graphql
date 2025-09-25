import { FastifyHelmetOptions } from '@fastify/helmet';
import { registerAs } from '@nestjs/config';

/**
 * Lista de hosts de confianza base empleada para construir directivas CSP
 * durante el desarrollo. Se puede extender mediante variable de entorno
 * en el futuro si es necesario.
 */
export const DEV_TRUSTED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '*.localhost',
  '*.local',
] as const;

/**
 * Orígenes de Apollo Studio / Sandbox permitidos solo en desarrollo
 * para facilitar pruebas de GraphQL.
 */
export const APOLLO_STUDIO_ORIGINS = [
  'https://sandbox.embed.apollographql.com',
  'https://studio.apollographql.com',
] as const;

/**
 * Obtiene si estamos en producción. Cualquier valor distinto a 'production'
 * se trata como desarrollo para facilitar la DX (fallback explícito).
 */
function isProduction(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'production';
}

/**
 * Construye un conjunto mínimo y mantenible de directivas CSP.
 * - Se evita sobre-configurar mientras la aplicación es pequeña.
 * - En desarrollo se usa reportOnly para depurar sin bloquear.
 */
function buildMinimalCsp(
  prod: boolean,
): Pick<FastifyHelmetOptions, 'contentSecurityPolicy'> {
  const allowDev = !prod;
  // Lista de hosts de desarrollo convertidos a variantes https:// para CSP.
  const httpsTrustedHosts = DEV_TRUSTED_HOSTS.map((h) => `https://${h}`);
  // Orígenes adicionales (normalizados) provenientes de env
  const extraCorsOrigins = resolveCorsAllowedOriginsForCsp();

  // Unificación sin duplicados
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
 * Parsea y normaliza los valores de CORS_ALLOWED_ORIGINS para uso en CSP.
 * - Split por comas
 * - Trim
 * - Elimina vacíos
 * - Convierte http:// -> https://
 * - Filtra solo https:// para evitar esquemas inseguros en CSP
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
 * Genera la configuración final de Helmet con un enfoque minimalista.
 * Se incluyen únicamente opciones con impacto directo y alto valor.
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
 * Exporta la configuración de Helmet a través del sistema de ConfigModule.
 * Mantener esta función libre de efectos secundarios facilita pruebas.
 */
export default registerAs('helmetConfig', (): FastifyHelmetOptions => {
  const prod = isProduction();
  return createHelmetOptions(prod);
});
