import { Module } from '@nestjs/common';
import { HandlerOrmErrorsService } from './applications/services/handler-orm-errors.service';

@Module({
  imports: [],
  exports: [HandlerOrmErrorsService],
  providers: [HandlerOrmErrorsService],
})
export class SharedModule {}
