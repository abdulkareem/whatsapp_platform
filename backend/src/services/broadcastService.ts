import { normalizePhone } from '../utils/phoneFormatter';
import { whatsappService } from './whatsappService';

export const broadcastService = {
  async enqueueBroadcast(mobiles: string[], message: string, _appKeyword?: string) {
    const normalizedMobiles = mobiles.map((mobile) => normalizePhone(mobile));

    await Promise.all(
      normalizedMobiles.map((mobile) => whatsappService.sendMessage(mobile, message))
    );

    return { queued: 0, sent: normalizedMobiles.length, mode: 'direct' as const };
  }
};
