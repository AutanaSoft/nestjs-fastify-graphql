/**
 * Configuración de Commitlint.
 * Reglas solicitadas:
 * - El scope es obligatorio.
 * - Máximo de 100 caracteres por línea (header, body y footer).
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
  },
};
