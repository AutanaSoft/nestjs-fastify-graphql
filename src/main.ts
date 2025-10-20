import { AppConfig, CORRELATION_ID_HEADER } from '@/config';
import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { CorsConfig } from './config/cors.config';
import { HelmetConfig } from './config/helmet.config';
import { buildGraphQLUrl, buildServerUrl } from './shared/applications/utils';

async function bootstrap() {
  const FastifyModule = new FastifyAdapter();

  // Enable Helmet for security headers
  // @ts-expect-error - Typings may be outdated
  FastifyModule.register(fastifyHelmet, HelmetConfig);

  // CORS configuration
  FastifyModule.enableCors(CorsConfig);

  // Custom request ID handling
  FastifyModule.getInstance().addHook('onRequest', (request, reply, done) => {
    reply.header('X-Request-Id', request.id);
    done();
  });

  // Set custom request ID generator to use correlation ID if provided
  FastifyModule.getInstance().setGenReqId((req) => {
    const correlationId = req.headers[CORRELATION_ID_HEADER];
    return Array.isArray(correlationId) ? correlationId[0] : correlationId || randomUUID();
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, FastifyModule, {
    bufferLogs: true,
  });

  // Obtener configuración de la aplicación
  const configService = app.get(ConfigService);
  const _appConfig = configService.getOrThrow<AppConfig>('appConfig');
  const _validationPipeOptions =
    configService.getOrThrow<ValidationPipeOptions>('validationPipeConfig');

  // Habilitar el logger de NestJS
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Configurar prefijo global si está habilitado
  if (_appConfig.server.useGlobalPrefix) {
    app.setGlobalPrefix(_appConfig.server.globalPrefix);
  }

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe(_validationPipeOptions));

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
