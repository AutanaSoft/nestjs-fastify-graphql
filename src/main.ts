import { AppConfig, CORRELATION_ID_HEADER } from '@/config';
import cors, { FastifyCorsOptions } from '@fastify/cors';
import helmet, { FastifyHelmetOptions } from '@fastify/helmet';
import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';
import { buildGraphQLUrl, buildServerUrl } from './shared/applications/utils';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  // Habilitar el logger de NestJS
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Obtener configuración de la aplicación
  const configService = app.get(ConfigService);
  const _appConfig = configService.getOrThrow<AppConfig>('appConfig');
  const _corsConfig = configService.getOrThrow<FastifyCorsOptions>('corsConfig');
  const _helmetOptions = configService.getOrThrow<FastifyHelmetOptions>('helmetConfig');
  const _validationPipeOptions =
    configService.getOrThrow<ValidationPipeOptions>('validationPipeConfig');

  // Obtener instancia del servidor Fastify
  const fastifyServer = app.getHttpAdapter().getInstance();

  // Middleware para gestionar Correlation ID
  fastifyServer.setGenReqId((req) => {
    const correlationId = req.headers[CORRELATION_ID_HEADER];
    return Array.isArray(correlationId) ? correlationId[0] : correlationId || randomUUID();
  });

  // Hook para añadir el Correlation ID a las respuestas
  fastifyServer.addHook('onRequest', (request, reply, done) => {
    reply.header(CORRELATION_ID_HEADER, request.id);
    done();
  });

  // Configurar prefijo global si está habilitado
  if (_appConfig.server.useGlobalPrefix) {
    app.setGlobalPrefix(_appConfig.server.globalPrefix);
  }

  // Habilitar CORS si está configurado
  await app.register(cors, _corsConfig);
  await app.register(helmet, _helmetOptions);

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
