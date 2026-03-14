import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const broadcastQueue = new Queue('broadcast-queue', { connection });

export interface BroadcastJobData {
  mobile: string;
  message: string;
  appKeyword?: string;
}
