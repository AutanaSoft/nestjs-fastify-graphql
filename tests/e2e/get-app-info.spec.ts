import { AppConfig } from '@/config';
import { GraphQLResponse } from '@/shared/applications/types';
import { ConfigService } from '@nestjs/config';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';

export const getAppInfoSpec = (getApp: () => NestFastifyApplication) => {
  describe('GetAppInfo', () => {
    let app: NestFastifyApplication;
    let appConfig: AppConfig;

    beforeEach(() => {
      app = getApp();
      const configService = app.get(ConfigService);
      appConfig = configService.getOrThrow<AppConfig>('appConfig');
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

      const response = await request(app.getHttpServer())
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
};
