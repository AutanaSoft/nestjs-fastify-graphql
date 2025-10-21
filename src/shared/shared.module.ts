import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import jwtConfig, { createJwtModuleOptions } from '@/config/jwt.config';
import { HandlerOrmErrorsService, JwtTokenService, PrismaService } from './applications/services';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: createJwtModuleOptions,
      inject: [jwtConfig.KEY],
    }),
  ],
  exports: [HandlerOrmErrorsService, JwtTokenService, PrismaService],
  providers: [HandlerOrmErrorsService, JwtTokenService, PrismaService],
})
export class SharedModule {}
