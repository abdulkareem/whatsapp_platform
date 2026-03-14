import { Queue } from 'bullmq';
import { env } from '../config/env';

const redisUrl = new URL(env.REDIS_URL);

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null
};

export const broadcastQueue = new Queue('broadcast-queue', { connection });

export interface BroadcastJobData {
  mobile: string;
  message: string;
  appKeyword?: string;
}
