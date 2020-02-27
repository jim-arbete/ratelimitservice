import * as Redis from 'ioredis';
import { NODE_ENV, REDIS_HOST } from './config';

// const redis = new Redis(); // Connect to 127.0.0.1:6379
const redis = new Redis(NODE_ENV == 'development' ? '' : REDIS_HOST ?? 'redis://redis-service:6379');

export default redis;
