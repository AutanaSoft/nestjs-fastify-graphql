/**
 * Lista de nombres de usuario prohibidos en el sistema.
 *
 * Esta constante contiene nombres reservados que no pueden ser
 * utilizados como nombres de usuario durante el registro.
 *
 * @remarks
 * La validación es case-insensitive, por lo que todos los nombres
 * se comparan en minúsculas independientemente de cómo se ingresen.
 *
 * @public
 */
export const FORBIDDEN_USER_NAMES: ReadonlyArray<string> = [
  'abuse',
  'admin',
  'administrator',
  'airmt',
  'anonymous',
  'api',
  'autana',
  'autanasoft',
  'contact',
  'demo',
  'ftp',
  'guest',
  'help',
  'hostmaster',
  'info',
  'mail',
  'moderator',
  'no-reply',
  'noreply',
  'null',
  'postmaster',
  'root',
  'security',
  'smtp',
  'soft',
  'software',
  'superuser',
  'support',
  'sysadmin',
  'system',
  'test',
  'undefined',
  'webmaster',
  'www',
];
