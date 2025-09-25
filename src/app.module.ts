import loggerConfig, { createLoggerModuleOptions } from '@config/logger.config';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
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
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
