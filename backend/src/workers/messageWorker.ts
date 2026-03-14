import { Worker } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { whatsappService } from '../services/whatsappService';
import { prisma } from '../database/prisma';

const redisUrl = new URL(env.REDIS_URL);

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null
};

new Worker(
  'broadcast-queue',
  async (job) => {
    const { mobile, message, appKeyword } = job.data as { mobile: string; message: string; appKeyword?: string };

    const response = await whatsappService.sendMessage(mobile, message);
    await prisma.messageLog.create({
      data: {
        mobile,
        message,
        direction: 'outgoing',
        app: appKeyword ?? 'SYSTEM',
        status: 'sent',
        providerMessageId: response?.messages?.[0]?.id
      }
    });

    logger.info('Broadcast message sent', { mobile, jobId: job.id });
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 1000
    }
  }
);

logger.info('Broadcast worker started');
