import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { plainToInstance } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  CreateUserArgsDto,
  FindUserByEmailArgsDto,
  FindUserByIdArgsDto,
  UpdateUserArgsDto,
} from '../../applications/dto/args';
import { UserEntityDto } from '../../applications/dto/responses';
import {
  CreateUserUseCase,
  FindUserByEmailUseCase,
  FindUserByIdUseCase,
  UpdateUserUseCase,
} from '../../applications/use-cases';

@Resolver()
export class UserResolvers {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
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

  @Mutation(() => UserEntityDto, { name: 'updateUser', description: 'Update an existing user' })
  async updateUser(@Args() data: UpdateUserArgsDto): Promise<UserEntityDto> {
    this.logger.assign({ resolver: 'updateUser' });
    this.logger.info('Updating user request received');
    const user = await this.updateUserUseCase.execute(data);
    this.logger.info('User updated successfully');
    return plainToInstance(UserEntityDto, user);
  }

  @Query(() => UserEntityDto, { name: 'findUserById', description: 'Find a user by ID' })
  async findUserById(@Args() query: FindUserByIdArgsDto): Promise<UserEntityDto> {
    this.logger.assign({ resolver: 'findUserById' });
    this.logger.info('Finding user by ID request received');
    const user = await this.findUserByIdUseCase.execute(query);
    this.logger.info('User found by ID successfully');
    return plainToInstance(UserEntityDto, user);
  }

  @Query(() => UserEntityDto, { name: 'findUserByEmail', description: 'Find a user by email' })
  async findUserByEmail(@Args() query: FindUserByEmailArgsDto): Promise<UserEntityDto> {
    this.logger.assign({ resolver: 'findUserByEmail' });
    this.logger.info('Finding user by email request received');
    const user = await this.findUserByEmailUseCase.execute(query);
    this.logger.info('User found by email successfully');
    return plainToInstance(UserEntityDto, user);
  }
}
