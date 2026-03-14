import { Request, Response } from 'express';
import { env } from '../config/env';
import { messageRouterService } from '../services/messageRouterService';
import { logger } from '../config/logger';
import type { WhatsAppInboundPayload } from '../types/shared';


export const webhookController = {
  verifyWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.VERIFY_TOKEN) {
      logger.info('Webhook verified');
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  },

  async receiveWebhook(req: Request<unknown, unknown, WhatsAppInboundPayload>, res: Response) {
    const body = req.body;

    if (body.object && body.object !== 'whatsapp_business_account') {
      return res.sendStatus(200);
    }

    const messages = body.entry?.flatMap((entry) =>
      entry.changes?.flatMap((change) => change.value?.messages ?? []) ?? []
    ) ?? body.messages ?? [];

    for (const item of messages) {
      const mobile = item.from;
      const message = item.text?.body?.trim();
      const messageId = (item as { id?: string }).id;
      const messageType = (item as { type?: string }).type;

      if (!mobile || !message) {
        logger.warn('Skipping inbound WhatsApp payload without mobile or text body', {
          messageId,
          messageType,
          hasMobile: Boolean(mobile),
          hasTextBody: Boolean(message)
        });
        continue;
      }

      logger.info('Inbound WhatsApp message received', {
        from: mobile,
        text: message,
        messageId,
        messageType
      });

      try {
        await messageRouterService.routeIncomingMessage(mobile, message);
      } catch (error) {
        logger.error('Failed to route inbound message', {
          error,
          mobile,
          message,
          messageId,
          messageType
        });
      }
    }

    return res.sendStatus(200);
  }
};
