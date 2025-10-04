import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Servicio de Prisma ORM para gestionar la conexión con la base de datos.
 *
 * Extiende PrismaClient para proporcionar acceso a todas las operaciones de base de datos
 * e implementa hooks del ciclo de vida de NestJS para manejar la conexión automáticamente.
 *
 * @public
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectPinoLogger(PrismaService.name) private readonly logger: PinoLogger) {
    super();
  }

  /**
   * Establece la conexión con la base de datos al inicializar el módulo.
   *
   * @throws Error si la conexión a la base de datos falla
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.info('Database connection established successfully');
    } catch (error: unknown) {
      this.logger.error({ error }, 'Failed to connect to database');
      throw error;
    }
  }

  /**
   * Cierra la conexión con la base de datos al destruir el módulo.
   *
   * @throws Error si la desconexión de la base de datos falla
   */
  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.info('Database connection closed successfully');
    } catch (error: unknown) {
      this.logger.error({ error }, 'Failed to disconnect from database');
      throw error;
    }
  }
}
