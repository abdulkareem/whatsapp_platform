import { broadcastQueue } from '../queue/messageQueue';
import { normalizePhone } from '../utils/phoneFormatter';

export const broadcastService = {
  async enqueueBroadcast(mobiles: string[], message: string, appKeyword?: string) {
    const jobs = mobiles.map((mobile) => ({
      name: `broadcast-${normalizePhone(mobile)}`,
      data: { mobile: normalizePhone(mobile), message, appKeyword }
    }));

    await broadcastQueue.addBulk(jobs);
    return { queued: jobs.length };
  }
};
