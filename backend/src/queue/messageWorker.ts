import { logger } from '../config/logger';
import { env } from '../config/env';
import { messageRouterService } from '../services/messageRouterService';
import { messageQueue } from './messageQueue';

const perAppNextExecutionAt = new Map<number, number>();

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const enforceAppRateLimit = async (appId: number, rateLimitRpm: number) => {
  const safeRate = Math.max(1, rateLimitRpm);
  const minimumSpacingMs = Math.ceil(60000 / safeRate);
  const now = Date.now();
  const nextAllowedAt = perAppNextExecutionAt.get(appId) ?? now;

  if (nextAllowedAt > now) {
    await sleep(nextAllowedAt - now);
  }

  perAppNextExecutionAt.set(appId, Math.max(nextAllowedAt, now) + minimumSpacingMs);
};

const processJob = async () => {
  const job = messageQueue.takeNextJob();

  if (!job) {
    return;
  }

  const startedAt = Date.now();

  try {
    const routeResult = await messageRouterService.routeIncomingMessage(job.payload.mobile, job.payload.message, {
      messageId: job.payload.messageId,
      beforeForward: enforceAppRateLimit
    });

    messageQueue.markCompleted(job.id);

    logger.info('Inbound queue job processed', {
      jobId: job.id,
      mobile: job.payload.mobile,
      messageId: job.payload.messageId,
      routeStatus: routeResult.status,
      routedApp: routeResult.routedKeyword,
      latencyMs: Date.now() - startedAt,
      queueBacklog: messageQueue.getStats().backlog
    });
  } catch (error) {
    messageQueue.markFailed(job, error);

    logger.error('Inbound queue job failed', {
      jobId: job.id,
      mobile: job.payload.mobile,
      messageId: job.payload.messageId,
      attemptsMade: job.attemptsMade,
      error
    });
  }
};

const workerConcurrency = Math.max(1, env.QUEUE_WORKER_CONCURRENCY);
let started = false;

export const startMessageWorker = () => {
  if (started) return;
  started = true;

  for (let i = 0; i < workerConcurrency; i += 1) {
    setInterval(() => {
      void processJob();
    }, 25);
  }

  logger.info('In-memory message queue worker started', { workerConcurrency });
};

export const getQueueStats = async () => messageQueue.getStats();

export const getFailedQueueJobs = async (limit = 50) => messageQueue.getFailed(limit).map((job) => ({
  id: job.id,
  mobile: job.payload.mobile,
  message: job.payload.message,
  messageId: job.payload.messageId,
  attemptsMade: job.attemptsMade,
  failedReason: job.failedReason,
  failedAt: job.failedAt
}));
