/**
 * Lista de dominios de email prohibidos en el sistema.
 *
 * Esta constante contiene dominios que no pueden ser utilizados
 * para registrar usuarios en la plataforma.
 *
 * @remarks
 * La validación es case-insensitive, por lo que todos los dominios
 * se comparan en minúsculas independientemente de cómo se ingresen.
 *
 * @public
 */
export const FORBIDDEN_EMAIL_DOMAINS: ReadonlyArray<string> = [
  'autanasoft.com',
  'airdashboard.net',
];
