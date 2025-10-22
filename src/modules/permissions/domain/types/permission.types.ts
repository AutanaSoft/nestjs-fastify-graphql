/**
 * Resultado de la operación de asignación de permisos.
 */
export type AssignPermissionsResult = {
  readonly userId: string;
  readonly assignedPermissions: string[];
  readonly alreadyAssigned: string[];
};

/**
 * Resultado de la operación de revocación de permisos.
 */
export type RevokePermissionsResult = {
  readonly userId: string;
  readonly revokedPermissions: string[];
  readonly notAssigned: string[];
};
