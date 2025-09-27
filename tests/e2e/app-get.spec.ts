import { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';

export const appGetTest = (getApp: () => NestFastifyApplication) => {
  describe('AppController (e2e)', () => {
    let app: NestFastifyApplication;

    beforeEach(() => {
      app = getApp();
    });

    it('/ (GET)', async () => {
      await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
    });
  });
};
