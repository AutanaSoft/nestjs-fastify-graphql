/**
 * Configuración de lint-staged para formateo y linting en staged files.
 * Usa ESLint (con Prettier integrado) para TypeScript/JavaScript
 * y Prettier directo para otros formatos de texto comunes.
 */
export default {
  '**/*.{ts,js}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md,yml,yaml}': ['prettier --write'],
};
