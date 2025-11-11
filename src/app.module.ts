import {
  appConfig,
  corsConfig,
  createGraphQLModuleOptions,
  createThrottlerModuleOptions,
  cryptoConfig,
  graphqlConfig,
  helmetConfig,
  jwtConfig,
  throttlerConfig,
  validationPipeConfig,
} from '@/config';
import { eventEmitterConfigFactory } from '@/config/event-emitter.config';
import loggerConfig, { createLoggerModuleOptions } from '@config/logger.config';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UsersModule } from './modules/users/users.module';
import { GraphQLExceptionFilter } from './shared/infrastructure/filters';
import { GqlThrottlerGuard } from './shared/infrastructure/guards/gql-throttler.guard';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
      load: [appConfig, corsConfig, helmetConfig, validationPipeConfig, jwtConfig, cryptoConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(loggerConfig)],
      inject: [loggerConfig.KEY],
      useFactory: createLoggerModuleOptions,
    }),
    EventEmitterModule.forRoot(eventEmitterConfigFactory()),
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
    SharedModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GraphQLExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    AppService,
    AppResolver,
  ],
})
export class AppModule {}
