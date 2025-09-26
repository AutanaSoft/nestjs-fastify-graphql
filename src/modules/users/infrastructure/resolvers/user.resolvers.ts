import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { plainToInstance } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CreateUserArgsDto } from '../../applications/dto/args';
import { UserEntityDto } from '../../applications/dto/responses';
import { CreateUserUseCase } from '../../applications/use-cases';

@Resolver()
export class UserResolvers {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    @InjectPinoLogger(UserResolvers.name) private readonly logger: PinoLogger,
  ) {}

  @Mutation(() => UserEntityDto, { name: 'createUser', description: 'Create a new user' })
  async createUser(@Args() data: CreateUserArgsDto): Promise<any> {
    this.logger.assign({ resolver: 'createUser' });
    this.logger.info('Creating a new user request received');
    const user = await this.createUserUseCase.execute(data);
    this.logger.info('New user created successfully');
    return plainToInstance(UserEntityDto, user);
  }
}
