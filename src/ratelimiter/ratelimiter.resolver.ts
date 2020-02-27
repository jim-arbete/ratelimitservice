import { Arg, Query, Resolver } from 'type-graphql';
import * as os from 'os';
import { RatelimitResponse, RatelimitInput, Serverinfo } from './ratelimiter.types';
import { RatelimitService } from './ratelimiter.service';

@Resolver(of => RatelimitResponse)
export class RatelimitResolver {
  ratelimitService = new RatelimitService();

  @Query(returns => RatelimitResponse, { nullable: true })
  async ratelimit(@Arg('ratelimitInput') ratelimitInput: RatelimitInput): Promise<RatelimitResponse | undefined> {
    const response = this.ratelimitService.checkRatelimit(ratelimitInput);
    return response;
  }

  @Query(returns => Serverinfo, { nullable: true })
  serverinfo(): Serverinfo | undefined {
    let computedIPs: any = Object.entries(os.networkInterfaces());
    computedIPs = computedIPs.flat(2).filter(f => f.family != 'IPv6');
    computedIPs = computedIPs.map(({ address }) => address).filter(Boolean).join();
    return { hostname: os.hostname(), hostIPs: String(computedIPs) };
  }
}
