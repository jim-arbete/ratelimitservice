import * as dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV ?? 'production';
export const REDIS_HOST = process.env.REDIS_HOST ?? null;
export const PORT = process.env.PORT ?? 4000;
export const RATELIMIT_BANNED_IP_SECONDS = process.env.RATELIMIT_BANNED_IP_SECONDS ?? 90;
export const RATELIMIT_FAILED_REQ_PER_OBSERVED_SECONDS = process.env.RATELIMIT_FAILED_REQ_PER_OBSERVED_SECONDS ?? 6;
export const RATELIMIT_MAX_FAILED_REQ_IN_OBSERVED_PERIOD = process.env.RATELIMIT_MAX_FAILED_REQ_IN_OBSERVED_PERIOD ?? 4;
export const RATELIMIT_MAX_FAILED_EMAIL_PER_IP = process.env.RATELIMIT_MAX_FAILED_EMAIL_PER_IP ?? 1;
