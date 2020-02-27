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
    let ips: any = Object.entries(os.networkInterfaces());
    ips = ips.flat(2).filter(f => f.family != 'IPv6');
    const computedIPs = ips.map(({ address }) => address).filter(Boolean).join();
    return { hostname: os.hostname(), hostIPs: String(computedIPs) };
  }
}
