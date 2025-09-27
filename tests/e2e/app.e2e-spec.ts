import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { appGetTest } from './app-get.spec';
import { getAppInfoSpec } from './get-app-info.spec';
import { createUserSpec } from './modules/users/create-user.spec';

describe('App Tests (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    const configService = app.get(ConfigService);
    const validationPipeOptions =
      configService.getOrThrow<ValidationPipeOptions>('validationPipeConfig');
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // aquí van las pruebas e2e (end-to-end) las cuales se tiene que importar de sus respectivos archivos
  describe('AppController', () => {
    appGetTest(() => app);
  });
  describe('App Resolvers', () => {
    getAppInfoSpec(() => app);
    describe('User Resolvers', () => {
      createUserSpec(() => app);
    });
  });
});
