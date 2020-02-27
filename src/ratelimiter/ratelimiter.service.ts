import { RatelimitInput, RatelimitResponse } from './ratelimiter.types';
import {
  RATELIMIT_BANNED_IP_SECONDS,
  RATELIMIT_FAILED_REQ_PER_OBSERVED_SECONDS,
  RATELIMIT_MAX_FAILED_REQ_IN_OBSERVED_PERIOD,
  RATELIMIT_MAX_FAILED_EMAIL_PER_IP,
} from '../utils/config';
import redis from '../utils/redis.config';

type StateBannedIP = {
  ip: string;
  timestamp: number;
};

type StateFailedRequests = {
  timestamps: number[];
  emails: string[];
};

interface RatelimitCustomSettings {
  configBannedSeconds: number;
  configFailedRequestObservedSeconds: number; // failed requests has been observed within the last Z seconds
  configMaxFailedRequestInObservedPeriod: number; // amount of failed requests allowed per `configFailedRequestObservedSeconds`.
  configMaxFailedEmailsPerIP: number; // failed requests using N different emails.
}

const computedBannedSeconds = Number(RATELIMIT_BANNED_IP_SECONDS) * 1000;
const computedFailedRequestObservedSeconds = Number(RATELIMIT_FAILED_REQ_PER_OBSERVED_SECONDS);
const computedMaxFailedRequestInObservedPeriod = Number(RATELIMIT_MAX_FAILED_REQ_IN_OBSERVED_PERIOD);
const computedMaxFailedEmailsPerIP = Number(RATELIMIT_MAX_FAILED_EMAIL_PER_IP);

// Given an event name, an IP address and an email address as input,
// build a rate limiting app that bans an IP address for a X seconds
// when Y failed requests has been observed within the last Z seconds
// using N different emails.
export class RatelimitService {
  configBannedSeconds: number;
  configFailedRequestObservedSeconds: number;
  configMaxFailedRequestInObservedPeriod: number;
  configMaxFailedEmailsPerIP: number;
  redisClient: any;

  constructor(settings?: RatelimitCustomSettings) {
    this.configBannedSeconds = settings?.configBannedSeconds ?? computedBannedSeconds;
    this.configFailedRequestObservedSeconds = settings?.configFailedRequestObservedSeconds ?? computedFailedRequestObservedSeconds;
    this.configMaxFailedRequestInObservedPeriod = settings?.configMaxFailedRequestInObservedPeriod ?? computedMaxFailedRequestInObservedPeriod;
    this.configMaxFailedEmailsPerIP = settings?.configMaxFailedEmailsPerIP ?? computedMaxFailedEmailsPerIP;
    this.redisClient = redis;
  }

  async checkRatelimit({ eventName, ip, email }: RatelimitInput): Promise<RatelimitResponse> {
    let isRateLimited = false;

    // If we can exit early to optimize the BAN check do it..
    // ELSE try to se if it's the REQUEST is a BANNABLE offense
    const quitEarlyCheck = await this.isRequestBannable({ eventName, ip, email });
    if (quitEarlyCheck) return { ipFrom: ip, isRateLimited: true };

    if (await this.isIpBanned(ip)) isRateLimited = true;
    return { ipFrom: ip, isRateLimited };
  }

  async getStateFailedRequestsByIP(ip: string): Promise<StateFailedRequests> {
    return JSON.parse(await this.redisClient.get(`ratelimiter:${ip}`));
  }

  async setStateFailedRequestsByIP(ip: string, newState: StateFailedRequests): Promise<void> {
    await this.redisClient.set(`ratelimiter:${ip}`, JSON.stringify(newState), 'EX', this.configFailedRequestObservedSeconds * 60);
  }

  async getStateBannedIPs(): Promise<StateBannedIP[]> {
    const currentState = JSON.parse(await this.redisClient.get(`ratelimiter:bannedips`)) ?? [];
    return currentState;
  }

  async setStateBannedIPs(ip: string): Promise<void> {
    const prevState = await this.getStateBannedIPs();
    const newState: StateBannedIP = {
      ip,
      timestamp: Date.now(),
    };
    await this.redisClient.set('ratelimiter:bannedips', JSON.stringify([newState, ...prevState]), 'EX', this.configBannedSeconds);
  }

  async isRequestBannable({ eventName, ip, email }: RatelimitInput): Promise<boolean> {
    if (eventName == 'login_succeeded') return false; // no offenses done, quit early

    // Get prev state!
    const prevState = await this.getStateFailedRequestsByIP(ip);

    // Remove state with OLD timestamps according to the `configFailedRequestObservedSeconds`
    const dateNow = Date.now();
    const timestamps = prevState?.timestamps
      ? prevState.timestamps.filter(timestamp => dateNow - timestamp < 1000 * this.configFailedRequestObservedSeconds)
      : [];

    // ADD the failed request to our STATE that tracks failed requests
    const newState = {
      timestamps: [Date.now(), ...timestamps],
      emails: prevState?.emails ? [...new Set([email, ...prevState.emails])] : [email],
    };
    await this.setStateFailedRequestsByIP(ip, newState);

    // Get fresh state!
    const currentState = await this.getStateFailedRequestsByIP(ip);

    // Check if To many failed requests AND emails!
    if (timestamps.length > this.configMaxFailedRequestInObservedPeriod && currentState.emails.length > this.configMaxFailedEmailsPerIP) {
      this.setStateBannedIPs(ip); // Ban hammer time!
      return true;
    }
    return false;
  }

  async isIpBanned(ip: string): Promise<boolean> {
    let isBanned = false;
    const currentState = await this.getStateBannedIPs();
    if (!!currentState.find(item => item.ip == ip)) isBanned = true;
    return isBanned;
  }
}
