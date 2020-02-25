import { IsIP, IsEmail } from 'class-validator';
import { InputType, Field, ObjectType } from 'type-graphql';

@InputType()
export class RatelimitInput {
  @Field()
  eventName: string;

  @Field()
  @IsIP()
  ip: string;

  @Field()
  @IsEmail()
  email: string;
}

@ObjectType()
export class RatelimitResponse {
  @Field()
  ipFrom: string;

  @Field()
  isRateLimited: boolean;
}
