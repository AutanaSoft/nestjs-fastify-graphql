import { Module } from '@nestjs/common';
import { HandlerOrmErrorsService, PrismaService } from './applications/services';

@Module({
  imports: [],
  exports: [HandlerOrmErrorsService, PrismaService],
  providers: [HandlerOrmErrorsService, PrismaService],
})
export class SharedModule {}
