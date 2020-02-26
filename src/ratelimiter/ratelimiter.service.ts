import { RatelimitInput, RatelimitResponse } from './ratelimiter.types';
import { RATELIMIT_BANNEDIPSECONDS } from '../utils/config';
import redis from '../utils/redis.config';

type StateBannedIP = {
  ip: string;
  timestamp: number;
};

type StateFailedRequests = {
  ip: string;
  timestamps: number[];
  emails: string[];
};

interface RatelimitCustomSettings {
  configBannedSeconds: number;
}

const mockStateFailedRequests = [
  { ip: '10.0.0.0', timestamps: [1582672217534, 1582673707990], emails: ['gg@gg.se'] },
  // { ip: '10.0.0.1', timestamp: 1582673707990 },
];

const mockStateBannedIP = [
  { ip: '10.0.0.0', timestamp: 1582672217534 },
  { ip: '10.0.0.1', timestamp: 1582673707990 },
];

// const computedBannedSeconds = Number(RATELIMIT_BANNEDIPSECONDS) * 1000;
const computedBannedSeconds = 2500 * 1000;

export class RatelimitService {
  configBannedSeconds: number;
  redisClient: any;
  state = 0;

  stateFailedRequests: StateFailedRequests[] = [...mockStateFailedRequests];
  stateBannedIPs: StateBannedIP[] = [...mockStateBannedIP];

  constructor(settings?: RatelimitCustomSettings) {
    this.configBannedSeconds = settings?.configBannedSeconds ?? computedBannedSeconds;
    this.redisClient = redis;
  }

  checkRatelimit({ eventName, ip, email }: RatelimitInput): RatelimitResponse {
    // Given an event name, an IP address and an email address as input

    let isRateLimited = false;
    // Given an event name, an IP address and an email address as input,
    // build a rate limiting app that bans an IP address for a X seconds
    // when Y failed requests has been observed within the last Z seconds
    // using N different emails.

    // ban an IP address for a X seconds
    this.state++;
    console.log('RatelimitService => RATELIMIT_BANNEDIPSECONDS :', RATELIMIT_BANNEDIPSECONDS);
    console.log('RatelimitService => this.state :', this.state);
    console.log('this.configBannedSeconds :', this.configBannedSeconds);
    console.log('this.stateBannedIPs :', this.stateBannedIPs);

    // If we can exit early to optimize the BAN check do it..
    // ELSE try to se if it's the REQUEST is a BANNABLE offense
    if (this.isRequestBannable({ eventName, ip, email })) return { ipFrom: ip, isRateLimited: true };

    this.flushOldBannedIps();
    if (this.isIpBanned(ip)) isRateLimited = true;
    return { ipFrom: ip, isRateLimited };
  }

  async getStateFailedRequests(): Promise<any[]> {
    // Wrapper for or store => Redis, or something else in the future..
    // if (!this.redisClient) return [];
    if (!this.redisClient) return [...mockStateFailedRequests];
    try {
      console.log('this.redisClient.get(test) :', this.redisClient.get('test'));
      return this.redisClient.get('test');
    } catch (e) {
      return null;
    }
  }

  async isRequestBannable({ eventName, ip, email }: RatelimitInput): Promise<boolean> {
    if (eventName == 'login_succeeded') return false; // no offenses done, quit early

    try {
      await this.redisClient.set('test', '1337');
    } catch (e) {
      console.log(e);
    }
    // ip:timestamp
    // ADD the failed request to our STATE
    const test = await this.getStateFailedRequests();
    console.log('test :', test);

    // Check if To many failed requests!
    // if (failedCount >= 10) {
    //   console.log('to many!!!');
    //   // Within the last Z seconds CHECK && 2 diffrent emails
    //   const lastXSeconds = Date.now() - 1000*10;
    //   if (Date.now() >= lastXSeconds) {

    // }
    console.log('test', eventName, ip, email);
    return false;
  }

  isIpBanned(ip: string): boolean {
    let isBanned = false;
    if (!!this.stateBannedIPs.find(item => item.ip == ip)) isBanned = true;
    return isBanned;
  }

  flushOldBannedIps(): void {
    // Flush out IPs that has been banned for `X` amount of seconds
    const dateNow = Date.now();
    this.stateBannedIPs = this.stateBannedIPs.filter(item => dateNow - item.timestamp < computedBannedSeconds);
  }
}
