import { FastifyHelmetOptions } from '@fastify/helmet';
import { registerAs } from '@nestjs/config';

/**
 * Tipo para la configuración de Helmet compatible con Fastify.
 */
export type HelmetConfig = FastifyHelmetOptions;

/**
 * Determina si el CSP está habilitado basado en la variable de entorno.
 *
 * @returns true si HELMET_ENABLE_CSP está configurado como 'true'
 */
function isCspEnabled(): boolean {
  return process.env.HELMET_ENABLE_CSP === 'true';
}

/**
 * Obtiene la lista de hosts de confianza desde las variables de entorno.
 * Usados para permitir conexiones WebSocket/HTTP en producción.
 *
 * @returns Array de hosts de confianza o array vacío si no está configurado
 */
function getTrustedHosts(): string[] {
  const hosts = process.env.HELMET_TRUSTED_HOSTS?.trim();
  return hosts
    ? hosts
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean)
    : [];
}

/**
 * Construye una política de seguridad de contenido (CSP) para Helmet.
 * Si CSP está deshabilitado, retorna false para permitir todo.
 * Si CSP está habilitado, aplica políticas estrictas para APIs REST/GraphQL.
 *
 * @returns Objeto con la configuración de contentSecurityPolicy o false
 */
function buildCspConfig(): Pick<FastifyHelmetOptions, 'contentSecurityPolicy'> {
  // Si CSP no está habilitado, permitir todo (recomendado para desarrollo con GraphQL Playground)
  if (!isCspEnabled()) {
    return { contentSecurityPolicy: false };
  }

  // CSP estricto para producción: API sin contenido HTML/estático
  // Solo permite conexiones a orígenes configurados
  const trustedHosts = getTrustedHosts();

  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        connectSrc: ["'self'", ...trustedHosts],
        frameAncestors: ["'none'"],
      },
      reportOnly: false,
    },
  };
}

/**
 * Fábrica de configuración para Helmet con Fastify.
 * Genera una configuración segura basada únicamente en HELMET_ENABLE_CSP:
 * - CSP deshabilitado (false): Todo está permitido
 * - CSP habilitado (true): Aplica políticas estrictas con hosts/CDN configurados
 *
 * @returns Configuración completa de Helmet para Fastify
 */
export const helmetConfigFactory = (): FastifyHelmetOptions => {
  const isEnable = isCspEnabled();
  const { contentSecurityPolicy } = buildCspConfig();

  return {
    // Usar la configuración CSP basada en HELMET_ENABLE_CSP
    contentSecurityPolicy,
    strictTransportSecurity: isEnable
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    dnsPrefetchControl: { allow: false },
    xssFilter: true,
  };
};

/**
 * Configuración de Helmet registrada en el sistema de configuración de NestJS.
 * Namespace: 'helmetConfig'
 */
export default registerAs('helmetConfig', (): FastifyHelmetOptions => helmetConfigFactory());
