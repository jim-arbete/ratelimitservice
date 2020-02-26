import { Arg, Query, Resolver } from 'type-graphql';
import { RatelimitResponse, RatelimitInput } from './ratelimiter.types';
import { RatelimitService } from './ratelimiter.service';

@Resolver(of => RatelimitResponse)
export class RatelimitResolver {
  ratelimitService = new RatelimitService();

  @Query(returns => RatelimitResponse, { nullable: true })
  async ratelimit(@Arg('ratelimitInput') ratelimitInput: RatelimitInput): Promise<RatelimitResponse | undefined> {
    // console.log('RatelimitResolver => ratelimitInput :', ratelimitInput);
    const response = this.ratelimitService.checkRatelimit(ratelimitInput);
    return response;
  }
}
