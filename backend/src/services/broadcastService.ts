import { broadcastQueue } from '../queue/messageQueue';
import { normalizePhone } from '../utils/phoneFormatter';
import { whatsappService } from './whatsappService';

export const broadcastService = {
  async enqueueBroadcast(mobiles: string[], message: string, appKeyword?: string) {
    const normalizedMobiles = mobiles.map((mobile) => normalizePhone(mobile));

    if (!broadcastQueue) {
      await Promise.all(
        normalizedMobiles.map((mobile) => whatsappService.sendMessage(mobile, message))
      );
      return { queued: 0, sent: normalizedMobiles.length, mode: 'direct' as const };
    }

    const jobs = normalizedMobiles.map((mobile) => ({
      name: `broadcast-${mobile}`,
      data: { mobile, message, appKeyword }
    }));

    await broadcastQueue.addBulk(jobs);
    return { queued: jobs.length, sent: 0, mode: 'queue' as const };
  }
};
