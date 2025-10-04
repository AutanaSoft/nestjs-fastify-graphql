import { UserEntityDto } from '@/modules/users/applications/dto';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { GraphQLResponse } from '@/shared/applications/types';
import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { setTestUserId, testUserVariables } from './user-test.config';

export const createUserSpec = (getApp: () => NestFastifyApplication) => {
  describe('CreateUser', () => {
    let app: NestFastifyApplication;

    const mutation = /* GraphQL */ `
      mutation CreateUser($input: CreateUserInputDto!) {
        createUser(data: $input) {
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

    it('debe fallar al intentar crear un usuario con un email inválido', async () => {
      const newVariables = {
        input: {
          ...testUserVariables.input,
          email: 'invalid-email',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: newVariables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe('Email must be a valid email address.');
      expect(error?.extensions?.code).toBe('USER_VALIDATION_ERROR');
      expect(error?.extensions?.status).toBe(HttpStatus.BAD_REQUEST);
      expect(error?.path?.[0]).toBe('createUser');
    });

    it('debe fallar al intentar crear un usuario con un userName invalido', async () => {
      const newVariables = {
        input: {
          ...testUserVariables.input,
          userName: 'ab',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: newVariables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe('UserName must be at least 3 characters long.');
      expect(error?.extensions?.code).toBe('USER_VALIDATION_ERROR');
      expect(error?.extensions?.status).toBe(HttpStatus.BAD_REQUEST);
      expect(error?.path?.[0]).toBe('createUser');
    });

    it('debe fallar al intentar crear un usuario con una contraseña débil', async () => {
      const newVariables = {
        input: {
          ...testUserVariables.input,
          password: 'weakkaew',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: newVariables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe(
        'Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
      );
      expect(error?.extensions?.code).toBe('USER_VALIDATION_ERROR');
      expect(error?.extensions?.status).toBe(HttpStatus.BAD_REQUEST);
      expect(error?.path?.[0]).toBe('createUser');
    });

    it('debe crear un usuario y devolver la entidad normalizada', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: testUserVariables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;

      expect(graphqlResponse.errors).toBeUndefined();
      expect(graphqlResponse.data).not.toBeNull();

      const createdUser = graphqlResponse.data?.createUser;
      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe(testUserVariables.input.email.toLowerCase());
      expect(createdUser?.userName).toBe(testUserVariables.input.userName);
      expect(createdUser?.id).toBeDefined();
      expect(createdUser?.status).toBe(UserStatus.REGISTERED.toUpperCase());
      expect(createdUser?.role).toBe(UserRole.USER.toUpperCase());
      expect(createdUser?.createdAt).toBeDefined();
      expect(createdUser?.updatedAt).toBeDefined();

      // Guardar el ID del usuario creado para los tests de actualización
      if (createdUser?.id) {
        setTestUserId(createdUser.id);
      }
    });

    it('debe fallar al intentar crear un usuario con un email ya existente', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: testUserVariables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe('User with this email or userName already exists');
      expect(error?.extensions?.code).toBe('CONFLICT');
      expect(error?.extensions?.status).toBe(HttpStatus.CONFLICT);
      expect(error?.path?.[0]).toBe('createUser');
    });

    it('debe fallar al intentar crear un usuario con un userName ya existente', async () => {
      const newVariables = {
        input: {
          ...testUserVariables.input,
          email: 'testUser+01@example.com',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: newVariables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe('User with this email or userName already exists');
      expect(error?.extensions?.code).toBe('CONFLICT');
      expect(error?.extensions?.status).toBe(HttpStatus.CONFLICT);
      expect(error?.path?.[0]).toBe('createUser');
    });
  });
};

type CreateUserResponse = {
  createUser: UserEntityDto | null;
};
