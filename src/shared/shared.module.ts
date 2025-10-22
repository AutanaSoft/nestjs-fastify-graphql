import jwtConfig, { createJwtModuleOptions } from '@/config/jwt.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HandlerOrmErrorsService, JwtTokenService, PrismaService } from './applications/services';
import { CryptoService } from './infrastructure/services';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: createJwtModuleOptions,
      inject: [jwtConfig.KEY],
    }),
  ],
  exports: [CryptoService, HandlerOrmErrorsService, JwtTokenService, PrismaService],
  providers: [CryptoService, HandlerOrmErrorsService, JwtTokenService, PrismaService],
})
export class SharedModule {}
