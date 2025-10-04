import { UserEntityDto } from '@/modules/users/applications/dto';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { GraphQLResponse } from '@/shared/applications/types';
import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { getTestUserId, testUserVariables } from './user-test.config';

export const findUserSpec = (getApp: () => NestFastifyApplication) => {
  describe('FindUser', () => {
    let app: NestFastifyApplication;

    beforeEach(() => {
      app = getApp();
    });

    describe('findUserById', () => {
      const findUserByIdQuery = /* GraphQL */ `
        query FindUserById($id: ID!) {
          findUserById(id: $id) {
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

      it('debe fallar al intentar buscar un usuario con ID inválido', async () => {
        const variables = {
          id: 'invalid-uuid',
        };

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query: findUserByIdQuery, variables })
          .expect(200);

        const graphqlResponse = response.body as GraphQLResponse<FindUserByIdResponse>;

        expect(graphqlResponse.data).toBeNull();
        expect(graphqlResponse.errors).toBeDefined();
        const error = graphqlResponse.errors?.[0];
        expect(error).toBeDefined();
        expect(error?.message).toBe('ID must be a valid UUID v4');
        expect(error?.extensions?.code).toBe('BAD_REQUEST');
        expect(error?.extensions?.status).toBe(HttpStatus.BAD_REQUEST);
      });

      it('debe fallar al intentar buscar un usuario inexistente por ID', async () => {
        const variables = {
          id: '123e4567-e89b-12d3-a456-426614174000',
        };

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query: findUserByIdQuery, variables })
          .expect(200);

        const graphqlResponse = response.body as GraphQLResponse<FindUserByIdResponse>;

        expect(graphqlResponse.data).toBeNull();
        expect(graphqlResponse.errors).toBeDefined();
        const error = graphqlResponse.errors?.[0];
        expect(error).toBeDefined();
        expect(error?.message).toBe('ID must be a valid UUID v4');
        expect(error?.extensions?.code).toBe('BAD_REQUEST');
        expect(error?.extensions?.status).toBe(HttpStatus.BAD_REQUEST);
      });

      it('debe encontrar un usuario existente por ID', async () => {
        const variables = {
          id: getTestUserId(),
        };

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query: findUserByIdQuery, variables })
          .expect(200);

        const graphqlResponse = response.body as GraphQLResponse<FindUserByIdResponse>;

        expect(graphqlResponse.errors).toBeUndefined();
        expect(graphqlResponse.data).not.toBeNull();

        const foundUser = graphqlResponse.data?.findUserById;
        expect(foundUser).toBeDefined();
        expect(foundUser?.id).toBe(getTestUserId());
        // El usuario fue modificado en los tests de update
        expect(foundUser?.userName).toBe('finalUserName');
        expect(foundUser?.email).toBe(testUserVariables.input.email.toLowerCase());
        expect(foundUser?.status).toBe(UserStatus.ACTIVE.toUpperCase());
        expect(foundUser?.role).toBe(UserRole.GUEST.toUpperCase());
        expect(foundUser?.createdAt).toBeDefined();
        expect(foundUser?.updatedAt).toBeDefined();
      });
    });

    describe('findUserByEmail', () => {
      const findUserByEmailQuery = /* GraphQL */ `
        query FindUserByEmail($email: String!) {
          findUserByEmail(email: $email) {
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

      it('debe fallar al intentar buscar con un email inválido', async () => {
        const variables = {
          email: 'invalid-email',
        };

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query: findUserByEmailQuery, variables })
          .expect(200);

        const graphqlResponse = response.body as GraphQLResponse<FindUserByEmailResponse>;

        expect(graphqlResponse.data).toBeNull();
        expect(graphqlResponse.errors).toBeDefined();
        const error = graphqlResponse.errors?.[0];
        expect(error).toBeDefined();
        expect(error?.message).toBe('Email must be a valid email address.');
        expect(error?.extensions?.code).toBe('USER_VALIDATION_ERROR');
        expect(error?.extensions?.status).toBe(HttpStatus.BAD_REQUEST);
      });

      it('debe fallar al intentar buscar un usuario inexistente por email', async () => {
        const variables = {
          email: 'nonexistent@example.com',
        };

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query: findUserByEmailQuery, variables })
          .expect(200);

        const graphqlResponse = response.body as GraphQLResponse<FindUserByEmailResponse>;

        expect(graphqlResponse.data).toBeNull();
        expect(graphqlResponse.errors).toBeDefined();
        const error = graphqlResponse.errors?.[0];
        expect(error).toBeDefined();
        expect(error?.message).toBe(`User not found with email: nonexistent@example.com`);
        expect(error?.extensions?.code).toBe('USER_NOT_FOUND');
        expect(error?.extensions?.status).toBe(HttpStatus.NOT_FOUND);
        expect(error?.path?.[0]).toBe('findUserByEmail');
      });

      it('debe encontrar un usuario por email', async () => {
        const variables = {
          email: testUserVariables.input.email.toLowerCase(),
        };

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query: findUserByEmailQuery, variables })
          .expect(200);

        const graphqlResponse = response.body as GraphQLResponse<FindUserByEmailResponse>;

        expect(graphqlResponse.errors).toBeUndefined();
        expect(graphqlResponse.data).not.toBeNull();

        const user = graphqlResponse.data?.findUserByEmail;
        expect(user).toBeDefined();
        expect(user?.id).toBe(getTestUserId());
        expect(user?.email).toBe(testUserVariables.input.email.toLowerCase());
        // El usuario fue modificado en los tests de update
        expect(user?.userName).toBe('finalUserName');
        expect(user?.status).toBe(UserStatus.ACTIVE.toUpperCase());
        expect(user?.role).toBe(UserRole.GUEST.toUpperCase());
      });

      it('debe encontrar un usuario por email en mayúsculas (búsqueda case-insensitive)', async () => {
        const variables = {
          email: testUserVariables.input.email.toUpperCase(),
        };

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query: findUserByEmailQuery, variables })
          .expect(200);

        const graphqlResponse = response.body as GraphQLResponse<FindUserByEmailResponse>;

        expect(graphqlResponse.errors).toBeUndefined();
        expect(graphqlResponse.data).not.toBeNull();

        const user = graphqlResponse.data?.findUserByEmail;
        expect(user).toBeDefined();
        expect(user?.id).toBe(getTestUserId());
        expect(user?.email).toBe(testUserVariables.input.email.toLowerCase());
        // El usuario fue modificado en los tests de update
        expect(user?.userName).toBe('finalUserName');
      });
    });
  });
};

type FindUserByIdResponse = {
  findUserById: UserEntityDto | null;
};

type FindUserByEmailResponse = {
  findUserByEmail: UserEntityDto | null;
};
