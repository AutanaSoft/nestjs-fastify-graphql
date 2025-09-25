import loggerConfig, { createLoggerModuleOptions } from '@config/logger.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig, corsConfig, helmetConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
      load: [appConfig, corsConfig, helmetConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(loggerConfig)],
      inject: [loggerConfig.KEY],
      useFactory: createLoggerModuleOptions,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
