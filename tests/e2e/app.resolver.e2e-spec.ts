import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '../../src/app.module';
import { AppConfig } from '../../src/config';

describe('AppResolver (e2e)', () => {
  let app: INestApplication;
  let appConfig: AppConfig;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const configService = app.get(ConfigService);
    appConfig = configService.getOrThrow<AppConfig>('appConfig');
  });

  afterAll(async () => {
    await app.close();
  });

  it('debe exponer la configuración de la aplicación vía GraphQL', async () => {
    const query = /* GraphQL */ `
      query GetAppInfo {
        getAppInfo {
          name
          description
          version
          server {
            host
            port
            useGlobalPrefix
            globalPrefix
            environment
            logLevel
          }
        }
      }
    `;

    const response = await request(app.getHttpServer() as unknown as Server)
      .post('/graphql')
      .send({ query })
      .expect(200);

    const graphqlResponse = response.body as GraphQLResponse<GetAppInfoData>;

    expect(graphqlResponse.errors).toBeUndefined();
    expect(graphqlResponse.data).toEqual({
      getAppInfo: {
        name: appConfig.name,
        description: appConfig.description,
        version: appConfig.version,
        server: {
          host: appConfig.server.host,
          port: appConfig.server.port,
          useGlobalPrefix: appConfig.server.useGlobalPrefix,
          globalPrefix: appConfig.server.globalPrefix,
          environment: appConfig.server.environment,
          logLevel: appConfig.server.logLevel,
        },
      },
    });
  });
});

type GraphQLResponse<TData> = {
  data: TData;
  errors?: unknown;
};

type GetAppInfoData = {
  getAppInfo: {
    name: string;
    description: string;
    version: string;
    server: {
      host: string;
      port: number;
      useGlobalPrefix: boolean;
      globalPrefix: string;
      environment: string;
      logLevel: string;
    };
  };
};
