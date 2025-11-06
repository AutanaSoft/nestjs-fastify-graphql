import {
  appConfigFactory,
  corsConfigFactory,
  helmetConfigFactory,
  validationPipeConfigFactory,
} from '@/config';
import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { buildGraphQLUrl, buildServerUrl } from './shared/applications/utils';

async function bootstrap() {
  const _appConfig = appConfigFactory();
  const _corsConfig = corsConfigFactory();
  const _helmetConfig = helmetConfigFactory();
  const _validationPipeConfig = validationPipeConfigFactory();
  const FastifyModule = new FastifyAdapter();

  // Enable Helmet for security headers
  FastifyModule.register(fastifyHelmet, _helmetConfig);

  // CORS configuration
  FastifyModule.enableCors(_corsConfig);

  // Custom request ID handling
  FastifyModule.getInstance().addHook('onRequest', (request, reply, done) => {
    reply.header('X-Request-Id', request.id);
    done();
  });

  // Set custom request ID generator to use correlation ID if provided
  const correlationIdHeader = _appConfig.server.correlationIdHeader.toLowerCase();
  FastifyModule.getInstance().setGenReqId((req) => {
    const correlationId = req.headers[correlationIdHeader];
    return Array.isArray(correlationId) ? correlationId[0] : correlationId || randomUUID();
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, FastifyModule, {
    bufferLogs: true,
  });

  // Habilitar el logger de NestJS
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Configurar prefijo global si está habilitado
  if (_appConfig.server.useGlobalPrefix) {
    app.setGlobalPrefix(_appConfig.server.globalPrefix);
  }

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe(_validationPipeConfig));

  // Iniciar la aplicación
  await app.listen(_appConfig.server.port, '0.0.0.0');
  const serverUrl = buildServerUrl(_appConfig);
  const graphqlUrl = buildGraphQLUrl(serverUrl);
  logger.log(`🚀 Server is running on: ${serverUrl}`);
  logger.log(`🚀 GraphQL is running on: ${graphqlUrl}`);
  logger.log(`🐛 Environment: ${_appConfig.server.environment}`);
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
