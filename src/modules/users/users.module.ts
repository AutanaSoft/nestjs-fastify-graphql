import { SharedModule } from '@/shared/shared.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CreateUserUseCase,
  FindUserByEmailUseCase,
  FindUserByIdUseCase,
  UpdateUserUseCase,
} from './applications/use-cases';
import { UserEntity } from './domain/entities';
import { USER_REPOSITORY } from './domain/repository';
import { UserTypeOrmAdapter } from './infrastructure/adapters';
import { UserResolvers } from './infrastructure/resolvers';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([UserEntity])],
  exports: [TypeOrmModule],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserTypeOrmAdapter,
    },
    CreateUserUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    UserResolvers,
  ],
})
export class UsersModule {}
