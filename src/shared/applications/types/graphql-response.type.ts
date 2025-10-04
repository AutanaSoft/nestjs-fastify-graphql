import { GraphQLError } from 'graphql';

/**
 * Representa la estructura de una respuesta GraphQL estándar.
 *
 * @typeParam TData - El tipo de datos esperado en la respuesta exitosa
 */
export type GraphQLResponse<TData> = {
  /** Los datos de la respuesta si la operación fue exitosa */
  data: TData | null;
  /** Los errores de GraphQL si la operación falló */
  errors?: GraphQLError[];
};
