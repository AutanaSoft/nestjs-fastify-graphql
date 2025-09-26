import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateUserInputDto } from '../inputs';

@ArgsType()
export class CreateUserArgsDto {
  @Field(() => CreateUserInputDto, { description: 'Data for creating a new user' })
  @Type(() => CreateUserInputDto)
  @ValidateNested()
  data!: CreateUserInputDto;
}
