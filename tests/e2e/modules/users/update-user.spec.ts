import { UserEntityDto } from '@/modules/users/applications/dto';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { GraphQLError } from 'graphql';
import request from 'supertest';
import { getTestUserId, testUserVariables } from './user-test.config';

export const updateUserSpec = (getApp: () => NestFastifyApplication) => {
  describe('UpdateUser', () => {
    let app: NestFastifyApplication;

    const updateUserMutation = /* GraphQL */ `
      mutation UpdateUser($id: ID!, $data: UpdateUserInputDto!) {
        updateUser(id: $id, data: $data) {
          id
          email
          userName
          status
          role
          createdAt
          updatedAt
        }
      }
    `;

    beforeEach(() => {
      app = getApp();
    });

    it('debe fallar al intentar actualizar un usuario con ID inválido', async () => {
      const variables = {
        id: 'invalid-uuid',
        data: {
          userName: 'updatedUserName',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<UpdateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe('The user ID must be a valid ID.');
      expect(error?.extensions?.code).toBe('BAD_REQUEST');
      expect(error?.extensions?.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('debe fallar al intentar actualizar un usuario inexistente', async () => {
      const variables = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        data: {
          userName: 'updatedUserName',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<UpdateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe(`User with ID 123e4567-e89b-12d3-a456-426614174000 not found`);
      expect(error?.extensions?.code).toBe('USER_NOT_FOUND');
      expect(error?.extensions?.status).toBe(HttpStatus.NOT_FOUND);
      expect(error?.path?.[0]).toBe('updateUser');
    });

    it('debe fallar al intentar actualizar con un userName inválido', async () => {
      const variables = {
        id: getTestUserId(),
        data: {
          userName: 'ab',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<UpdateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe('UserName must contain at least 4 characters.');
      expect(error?.extensions?.code).toBe('BAD_REQUEST');
      expect(error?.extensions?.status).toBe(HttpStatus.BAD_REQUEST);
      expect(error?.path?.[0]).toBe('updateUser');
    });

    it('debe actualizar solo el userName del usuario', async () => {
      const variables = {
        id: getTestUserId(),
        data: {
          userName: 'updatedUserName',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<UpdateUserResponse>;

      expect(graphqlResponse.errors).toBeUndefined();
      expect(graphqlResponse.data).not.toBeNull();

      const updatedUser = graphqlResponse.data?.updateUser;
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.id).toBe(getTestUserId());
      expect(updatedUser?.userName).toBe('updatedUserName');
      expect(updatedUser?.email).toBe(testUserVariables.input.email.toLowerCase());
      expect(updatedUser?.status).toBe(UserStatus.REGISTERED.toUpperCase());
      expect(updatedUser?.role).toBe(UserRole.USER.toUpperCase());
      expect(updatedUser?.updatedAt).toBeDefined();
    });

    it('debe actualizar el status del usuario', async () => {
      const variables = {
        id: getTestUserId(),
        data: {
          status: UserStatus.ACTIVE.toUpperCase(),
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<UpdateUserResponse>;

      expect(graphqlResponse.errors).toBeUndefined();
      expect(graphqlResponse.data).not.toBeNull();

      const updatedUser = graphqlResponse.data?.updateUser;
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.id).toBe(getTestUserId());
      expect(updatedUser?.status).toBe(UserStatus.ACTIVE.toUpperCase());
    });

    it('debe actualizar el role del usuario', async () => {
      const variables = {
        id: getTestUserId(),
        data: {
          role: UserRole.ADMIN.toUpperCase(),
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<UpdateUserResponse>;

      expect(graphqlResponse.errors).toBeUndefined();
      expect(graphqlResponse.data).not.toBeNull();

      const updatedUser = graphqlResponse.data?.updateUser;
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.id).toBe(getTestUserId());
      expect(updatedUser?.role).toBe(UserRole.ADMIN.toUpperCase());
    });

    it('debe actualizar múltiples campos del usuario simultáneamente', async () => {
      const variables = {
        id: getTestUserId(),
        data: {
          userName: 'finalUserName',
          status: UserStatus.ACTIVE.toUpperCase(),
          role: UserRole.GUEST.toUpperCase(),
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<UpdateUserResponse>;

      expect(graphqlResponse.errors).toBeUndefined();
      expect(graphqlResponse.data).not.toBeNull();

      const updatedUser = graphqlResponse.data?.updateUser;
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.id).toBe(getTestUserId());
      expect(updatedUser?.userName).toBe('finalUserName');
      expect(updatedUser?.status).toBe(UserStatus.ACTIVE.toUpperCase());
      expect(updatedUser?.role).toBe(UserRole.GUEST.toUpperCase());
      expect(updatedUser?.email).toBe(testUserVariables.input.email.toLowerCase());
    });
  });
};

type GraphQLResponse<TData> = {
  data: TData | null;
  errors?: GraphQLError[];
};

type UpdateUserResponse = {
  updateUser: UserEntityDto | null;
};
