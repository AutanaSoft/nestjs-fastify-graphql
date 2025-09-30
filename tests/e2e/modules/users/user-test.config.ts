import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { DataSource, ILike } from 'typeorm';
import { UserEntity } from '@/modules/users/domain/entities';

/**
 * Tipo para la respuesta de creación de usuario en GraphQL.
 */
type CreateUserResponse = {
  createUser: {
    id: string;
    email: string;
    userName: string;
    status: string;
    role: string;
  } | null;
};

/**
 * Tipo para la respuesta GraphQL.
 */
type GraphQLResponse<TData> = {
  data: TData | null;
  errors?: unknown[];
};

/**
 * Variables compartidas para los tests e2e del módulo de usuarios.
 */
export const testUserVariables = {
  input: {
    userName: 'testUser',
    email: 'testUser@example.com',
    password: 'StrongPwd1!',
  },
};

/**
 * Mutation GraphQL para crear un usuario.
 */
export const createUserMutation = /* GraphQL */ `
  mutation CreateUser($input: CreateUserInputDto!) {
    createUser(data: $input) {
      id
      email
      userName
      status
      role
    }
  }
`;

/**
 * ID del usuario de prueba creado.
 * Se establece en setTestUserId y se usa en los tests.
 */
let testUserId: string = '';

/**
 * Obtiene el ID del usuario de prueba.
 *
 * @returns string ID del usuario de prueba
 */
export function getTestUserId(): string {
  return testUserId;
}

/**
 * Establece el ID del usuario de prueba.
 *
 * @param id ID del usuario de prueba
 */
export function setTestUserId(id: string): void {
  testUserId = id;
}

/**
 * Crea un usuario de prueba antes de ejecutar los tests del módulo.
 *
 * @param app Instancia de la aplicación NestJS/Fastify
 * @returns Promise<string> ID del usuario creado
 */
export async function setupTestUser(app: NestFastifyApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/graphql')
    .send({ query: createUserMutation, variables: testUserVariables });

  const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;
  const userId = graphqlResponse.data?.createUser?.id;
  setTestUserId(userId || '');
  return getTestUserId();
}

/**
 * Elimina el usuario de prueba después de ejecutar todos los tests del módulo.
 *
 * @param app Instancia de la aplicación NestJS/Fastify
 */
export async function cleanupTestUser(app: NestFastifyApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const repository = dataSource.getRepository(UserEntity);
  await repository.delete({ email: ILike(testUserVariables.input.email) });
}
