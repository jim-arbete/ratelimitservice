import { RatelimitInput } from './ratelimiter.types';

export class RatelimitService {
  checkRatelimit({ eventName, ip, email }: RatelimitInput): any {
    console.log('RatelimitService => eventName, ip, email :', eventName, ip, email);
    return {} as any;
  }

}
