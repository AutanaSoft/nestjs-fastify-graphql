import loggerConfig, { createLoggerModuleOptions } from '@config/logger.config';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import {
  appConfig,
  corsConfig,
  createGraphQLModuleOptions,
  graphqlConfig,
  helmetConfig,
} from './config';
import throttlerConfig, { createThrottlerModuleOptions } from './config/throttler.config';
import { GqlThrottlerGuard } from './shared/infrastructure/guards/gql-throttler.guard';

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
    GraphQLModule.forRootAsync({
      imports: [ConfigModule.forFeature(graphqlConfig)],
      inject: [graphqlConfig.KEY],
      driver: ApolloDriver,
      useFactory: createGraphQLModuleOptions,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule.forFeature(throttlerConfig)],
      inject: [throttlerConfig.KEY],
      useFactory: createThrottlerModuleOptions,
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    AppService,
    AppResolver,
  ],
})
export class AppModule {}
