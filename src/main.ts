import { AppConfig, CORRELATION_ID_HEADER } from '@config/app.config';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );

  // Obtener configuración de la aplicación
  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('appConfig');

  // Obtener instancia del servidor Fastify
  const fastifyServer = app.getHttpAdapter().getInstance();

  // Middleware para gestionar Correlation ID
  fastifyServer.setGenReqId((req) => {
    const correlationId = req.headers[CORRELATION_ID_HEADER];
    return Array.isArray(correlationId)
      ? correlationId[0]
      : correlationId || randomUUID();
  });

  // Hook para añadir el Correlation ID a las respuestas
  fastifyServer.addHook('onRequest', (request, reply, done) => {
    reply.header(CORRELATION_ID_HEADER, request.id);
    done();
  });

  // Configurar prefijo global si está habilitado
  if (appConfig.server.useGlobalPrefix) {
    app.setGlobalPrefix(appConfig.server.globalPrefix);
  }

  // Iniciar la aplicación
  await app.listen(appConfig.server.port, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
