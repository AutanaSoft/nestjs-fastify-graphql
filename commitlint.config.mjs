/**
 * Configuración de Commitlint.
 * Reglas solicitadas:
 * - El scope es obligatorio.
 * - Máximo de 100 caracteres por línea (header, body y footer).
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Requiere que el scope no esté vacío en el encabezado del commit
    'scope-empty': [2, 'never'],
    // Límite de longitud del encabezado (tipo(scope): asunto)
    'header-max-length': [2, 'always', 100],
    // Límite de longitud por línea en el cuerpo del commit
    'body-max-line-length': [2, 'always', 100],
    // Límite de longitud por línea en el pie del commit
    'footer-max-line-length': [2, 'always', 100],
  },
};
