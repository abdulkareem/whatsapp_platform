import { queueLatencyHistogram } from '../config/metrics';
import { logger } from '../config/logger';
import { drainInMemoryJobs } from '../queue/platformQueue';

const handlers: Record<string, (payload: any) => Promise<void>> = {
  'incoming.route': async () => undefined,
  'outgoing.send': async () => undefined,
  'campaign.process': async () => undefined,
  'retry.failed': async () => undefined
};

export const startPlatformWorker = () => {
  setInterval(async () => {
    const jobs = drainInMemoryJobs();

    for (const job of jobs) {
      const latencySeconds = Math.max(0, Date.now() - job.queuedAt) / 1000;
      queueLatencyHistogram.labels('in-memory-platform', job.name).observe(latencySeconds);

      try {
        await (handlers[job.name] ?? (async () => undefined))(job.payload);
      } catch (error) {
        logger.error('In-memory platform job failed', {
          name: job.name,
          error: error instanceof Error ? error.message : 'unknown error'
        });
      }
    }
  }, 1000);
};
