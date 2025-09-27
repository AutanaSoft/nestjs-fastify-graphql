import { UserEntityDto } from '@/modules/users/applications/dto';
import { UserEntity } from '@/modules/users/domain/entities';
import { UserRole, UserStatus } from '@/modules/users/domain/enums/user.enum';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { GraphQLError } from 'graphql';
import request from 'supertest';
import { DataSource, ILike } from 'typeorm';

export const createUserSpec = (getApp: () => NestFastifyApplication) => {
  describe('CreateUser', () => {
    let app: NestFastifyApplication;

    const variables = {
      input: {
        userName: 'testUser',
        email: 'testUser@example.com',
        password: 'StrongPwd1!',
      },
    };

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

    afterAll(async () => {
      const dataSource = app.get(DataSource);
      const repository = dataSource.getRepository(UserEntity);
      await repository.delete({ email: ILike(variables.input.email) });
    });

    it('debe fallar al intentar crear un usuario con un email inválido', async () => {
      const newVariables = {
        input: {
          ...variables.input,
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
      expect(error?.extensions?.code).toBe('BAD_REQUEST');
      expect(error?.extensions?.status).toBe(400);
      expect(error?.path?.[0]).toBe('createUser');
    });

    it('debe fallar al intentar crear un usuario con un userName invalido', async () => {
      const newVariables = {
        input: {
          ...variables.input,
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
      expect(error?.message).toBe('UserName must contain at least 4 characters.');
      expect(error?.extensions?.code).toBe('BAD_REQUEST');
      expect(error?.extensions?.status).toBe(400);
      expect(error?.path?.[0]).toBe('createUser');
    });

    it('debe fallar al intentar crear un usuario con una contraseña débil', async () => {
      const newVariables = {
        input: {
          ...variables.input,
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
        'Password must include uppercase, lowercase, numeric and special characters (@$!%*?&).',
      );
      expect(error?.extensions?.code).toBe('BAD_REQUEST');
      expect(error?.extensions?.status).toBe(400);
      expect(error?.path?.[0]).toBe('createUser');
    });

    it('debe crear un usuario y devolver la entidad normalizada', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;

      expect(graphqlResponse.errors).toBeUndefined();
      expect(graphqlResponse.data).not.toBeNull();

      const createdUser = graphqlResponse.data?.createUser;
      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe(variables.input.email.toLowerCase());
      expect(createdUser?.userName).toBe(variables.input.userName);
      expect(createdUser?.id).toBeDefined();
      expect(createdUser?.status).toBe(UserStatus.REGISTERED.toUpperCase());
      expect(createdUser?.role).toBe(UserRole.USER.toUpperCase());
      expect(createdUser?.createdAt).toBeDefined();
      expect(createdUser?.updatedAt).toBeDefined();
    });

    it('debe fallar al intentar crear un usuario con un email ya existente', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables })
        .expect(200);

      const graphqlResponse = response.body as GraphQLResponse<CreateUserResponse>;

      expect(graphqlResponse.data).toBeNull();
      expect(graphqlResponse.errors).toBeDefined();
      const error = graphqlResponse.errors?.[0];
      expect(error).toBeDefined();
      expect(error?.message).toBe('User with this email or userName already exists');
      expect(error?.extensions?.code).toBe('CONFLICT');
      expect(error?.extensions?.statusCode).toBe(409);
      expect(error?.path?.[0]).toBe('createUser');
    });

    it('debe fallar al intentar crear un usuario con un userName ya existente', async () => {
      const newVariables = {
        input: {
          ...variables.input,
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
      expect(error?.extensions?.statusCode).toBe(409);
      expect(error?.path?.[0]).toBe('createUser');
    });
  });
};

type GraphQLResponse<TData> = {
  data: TData | null;
  errors?: GraphQLError[];
};

type CreateUserResponse = {
  createUser: UserEntityDto | null;
};
