import { Request, Response } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { WhatsAppInboundPayload } from '../types/shared';
import { messageQueue } from '../queue/messageQueue';

type NormalizedInboundMessage = {
  mobile?: string;
  message?: string;
  messageId?: string;
  messageType?: string;
};

const extractMessageText = (item: NonNullable<WhatsAppInboundPayload['messages']>[number]) => {
  const textCandidates = [
    item.text?.body,
    item.button?.text,
    item.interactive?.button_reply?.title,
    item.interactive?.list_reply?.title,
    item.image?.caption,
    item.video?.caption,
    item.document?.caption
  ];

  return textCandidates.find((value) => value?.trim())?.trim();
};

const normalizeMessages = (body: WhatsAppInboundPayload): NormalizedInboundMessage[] => {
  const nestedMessages = body.entry?.flatMap((entry) =>
    entry.changes?.flatMap((change) =>
      (change.value?.messages ?? []).map((message) => ({
        ...message,
        from: message.from ?? change.value?.contacts?.[0]?.wa_id
      }))
    ) ?? []
  ) ?? [];

  const topLevelMessages = body.messages ?? [];
  const payloadMessages = [...nestedMessages, ...topLevelMessages];

  return payloadMessages.map((item) => ({
    mobile: item.from,
    message: extractMessageText(item),
    messageId: item.id,
    messageType: item.type
  }));
};

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

    const normalizedMessages = normalizeMessages(body);

    if (normalizedMessages.length === 0) {
      const statusCount =
        body.entry?.reduce(
          (count, entry) =>
            count +
            (entry.changes?.reduce((innerCount, change) => innerCount + (change.value?.statuses?.length ?? 0), 0) ?? 0),
          0
        ) ?? 0;

      logger.info('Webhook received without inbound user messages', {
        object: body.object,
        entryCount: body.entry?.length ?? 0,
        statusCount
      });
    }

    for (const item of normalizedMessages) {
      const { mobile, message, messageId, messageType } = item;

      if (!mobile || !message) {
        logger.warn('Skipping inbound WhatsApp payload without mobile or text body', {
          messageId,
          messageType,
          hasMobile: Boolean(mobile),
          hasTextBody: Boolean(message)
        });
        continue;
      }

      messageQueue.enqueue({ mobile, message, messageId });

      logger.info('Inbound WhatsApp message enqueued', {
        from: mobile,
        text: message,
        messageId,
        messageType
      });
    }

    return res.sendStatus(200);
  }
};
