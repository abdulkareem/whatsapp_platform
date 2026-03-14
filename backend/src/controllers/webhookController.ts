import { Request, Response } from 'express';
import { env } from '../config/env';
import { messageRouterService } from '../services/messageRouterService';
import { logger } from '../config/logger';
import { WhatsAppInboundPayload } from '../types/whatsapp';

export const webhookController = {
  verifyWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ error: 'Webhook verification failed' });
  },

  async receiveWebhook(req: Request<unknown, unknown, WhatsAppInboundPayload>, res: Response) {
    const body = req.body;

    const messages = body.entry?.flatMap((entry) =>
      entry.changes?.flatMap((change) => change.value?.messages ?? []) ?? []
    ) ?? body.messages ?? [];

    for (const item of messages) {
      const mobile = item.from;
      const message = item.text?.body;

      if (!mobile || !message) {
        continue;
      }

      try {
        await messageRouterService.routeIncomingMessage(mobile, message);
      } catch (error) {
        logger.error('Failed to route inbound message', { error, mobile, message });
      }
    }

    return res.status(200).json({ received: true });
  }
};
