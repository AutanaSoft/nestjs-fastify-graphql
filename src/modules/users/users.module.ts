import { SharedModule } from '@/shared/shared.module';
import { Module } from '@nestjs/common';
import {
  FindUserByEmailUseCase,
  FindUserByIdUseCase,
  UpdateUserUseCase,
} from './applications/use-cases';
import { USER_REPOSITORY } from './domain/repository';
import { UserPrismaAdapter } from './infrastructure/adapters';
import { UserResolvers } from './infrastructure/resolvers';

@Module({
  imports: [SharedModule],
  exports: [USER_REPOSITORY],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserPrismaAdapter,
    },
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    UserResolvers,
  ],
})
export class UsersModule {}
