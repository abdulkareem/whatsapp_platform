import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { whatsappService } from '../services/whatsappService';
import { prisma } from '../database/prisma';

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

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
