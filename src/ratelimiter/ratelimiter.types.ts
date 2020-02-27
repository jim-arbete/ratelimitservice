import { IsIP, IsEmail } from 'class-validator';
import { InputType, Field, ObjectType, registerEnumType } from 'type-graphql';

export enum EventName {
  'LOGIN_FAILED' = 'login_failed',
  'LOGIN_SUCCEEDED' = 'login_succeeded',
}
registerEnumType(EventName, {
  name: 'EventName',
});

@InputType()
export class RatelimitInput {
  @Field(type => EventName)
  eventName: EventName;

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

@ObjectType({ description: 'Used to check instances of loadbalance test' })
export class Serverinfo {
  @Field()
  hostIPs: string;

  @Field()
  hostname: string;
}
