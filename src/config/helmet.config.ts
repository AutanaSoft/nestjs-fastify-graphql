import { FastifyHelmetOptions } from '@fastify/helmet';
import { registerAs } from '@nestjs/config';

/**
 * Hosts HTTP confiables para desarrollo local.
 * @remarks
 * Se utilizan en las directivas CSP para permitir recursos desde localhost durante el desarrollo.
 * Solo se aplican cuando NODE_ENV no es 'production'.
 */
export const DEV_TRUSTED_HOSTS: string[] = ['http://localhost', 'http://127.0.0.1'];

/**
 * Orígenes autorizados de Apollo Studio para embeber GraphQL Playground.
 * @remarks
 * Estos dominios se permiten en las directivas frameAncestors y frameSrc únicamente en desarrollo,
 * permitiendo que Apollo Studio embeba el playground de GraphQL en un iframe.
 * En producción estas directivas se configuran como 'none' por seguridad.
 */
export const APOLLO_STUDIO_ORIGINS = [
  'https://sandbox.embed.apollographql.com',
  'https://studio.apollographql.com',
] as const;

/**
 * CDNs de Apollo Server para recursos estáticos (scripts, estilos, imágenes, fuentes).
 * @remarks
 * Estos dominios se utilizan por Apollo Server Landing Page y el Sandbox embebido.
 * Solo se permiten en desarrollo para cargar recursos del playground de GraphQL.
 * Incluye CDNs para scripts, estilos, imágenes y fuentes de Google.
 */
export const APOLLO_CDN_ORIGINS = [
  'https://apollo-server-landing-page.cdn.apollographql.com',
  'https://embeddable-sandbox.cdn.apollographql.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
] as const;

/**
 * Tipo exportado para la configuración de Helmet compatible con Fastify.
 * @remarks
 * Útil para inyección de dependencias usando `ConfigType<typeof helmetConfig>`.
 */
export type HelmetConfig = FastifyHelmetOptions;

/**
 * Valida y filtra orígenes según criterios de seguridad.
 * @param origins Array de URLs a validar.
 * @param requireHttps Si es true, solo acepta URLs con protocolo HTTPS.
 * @returns Array de URLs válidas que cumplen los criterios.
 */
function validateOrigins(origins: string[], requireHttps = false): string[] {
  return origins.filter((origin) => {
    try {
      const url = new URL(origin);
      return !requireHttps || url.protocol === 'https:';
    } catch {
      return false;
    }
  });
}

/**
 * Obtiene hosts de producción confiables desde variables de entorno.
 * @returns Array de hosts HTTPS validados para producción.
 */
function getProdTrustedHosts(): string[] {
  const prodHostsEnv = process.env.HELMET_PROD_TRUSTED_HOSTS || '';
  const prodHosts = prodHostsEnv
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  return validateOrigins(prodHosts, true);
}

/**
 * Construye una política CSP mínima adecuada para Fastify Helmet según el entorno.
 * @remarks
 * En desarrollo permite orígenes adicionales, scripts inline y reporta violaciones sin bloquear.
 * En producción aplica restricciones estrictas y bloquea activamente las violaciones.
 * @returns Configuración parcial con la política de seguridad de contenidos.
 */
function buildMinimalCsp(): Pick<FastifyHelmetOptions, 'contentSecurityPolicy'> {
  const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';
  const allowDev = !isProduction;
  const prodTrustedHosts = getProdTrustedHosts();
  const trustedOrigins = Array.from(new Set<string>([...DEV_TRUSTED_HOSTS, ...prodTrustedHosts]));

  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          ...(allowDev
            ? ["'unsafe-inline'", "'unsafe-eval'", ...trustedOrigins, ...APOLLO_CDN_ORIGINS]
            : []),
        ],
        styleSrc: [
          "'self'",
          ...(allowDev ? ["'unsafe-inline'", ...trustedOrigins, ...APOLLO_CDN_ORIGINS] : []),
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          ...(allowDev ? [...trustedOrigins, ...APOLLO_CDN_ORIGINS] : []),
        ],
        connectSrc: ["'self'", ...(allowDev ? ['ws:', 'wss:', ...trustedOrigins] : [])],
        fontSrc: [
          "'self'",
          'data:',
          ...(allowDev ? [...trustedOrigins, ...APOLLO_CDN_ORIGINS] : []),
        ],
        manifestSrc: ["'self'", ...(allowDev ? APOLLO_CDN_ORIGINS : [])],
        objectSrc: ["'none'"],
        frameAncestors: allowDev ? ["'self'", ...APOLLO_STUDIO_ORIGINS] : ["'none'"],
        frameSrc: allowDev ? ["'self'", ...APOLLO_STUDIO_ORIGINS] : ["'none'"],
      },
      reportOnly: allowDev,
    },
  };
}

/**
 * Crea las opciones completas de Helmet para Fastify con configuración adaptativa por entorno.
 * @remarks
 * En desarrollo deshabilita CSP completamente para facilitar debugging y uso de herramientas.
 * En producción incluye CSP estricta, HSTS y otras cabeceras de seguridad recomendadas.
 * @returns Configuración completa de Helmet compatible con Fastify.
 */
function createHelmetOptions(): FastifyHelmetOptions {
  const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';
  const { contentSecurityPolicy } = buildMinimalCsp();

  return {
    // Deshabilitar CSP en desarrollo para evitar interferencias con herramientas
    contentSecurityPolicy: isProduction ? contentSecurityPolicy : false,
    strictTransportSecurity: isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    dnsPrefetchControl: { allow: false },
    xssFilter: true,
  };
}

/**
 * Instancia pre-configurada de opciones de Helmet para Fastify.
 * @remarks
 * Exportación lista para usar directamente sin necesidad de llamar a createHelmetOptions().
 * La configuración se adapta automáticamente según el entorno (desarrollo/producción).
 */
export const HelmetConfig: FastifyHelmetOptions = createHelmetOptions();

export default registerAs('helmetConfig', (): FastifyHelmetOptions => HelmetConfig);
