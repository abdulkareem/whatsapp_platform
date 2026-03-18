import { Request, Response } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { WhatsAppInboundPayload, WhatsAppLocation } from '../types/shared';
import { messageQueue } from '../queue/messageQueue';
import { inboundMessagesCounter } from '../config/metrics';

type NormalizedInboundMessage = {
  mobile?: string;
  message?: string;
  messageId?: string;
  messageType?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  locationError?: string;
};

const extractMessageText = (item: NonNullable<WhatsAppInboundPayload['messages']>[number]) => {
  const textCandidates = [
    item.text?.body,
    item.button?.text,
    item.button?.payload,
    item.interactive?.button_reply?.title,
    item.interactive?.list_reply?.title,
    item.interactive?.nfm_reply?.body,
    item.interactive?.nfm_reply?.response_json,
    item.image?.caption,
    item.video?.caption,
    item.document?.caption
  ];

  return textCandidates.find((value) => value?.trim())?.trim();
};


const parseLocation = (location?: WhatsAppLocation) => {
  if (!location) {
    return { error: 'Missing location payload' } as const;
  }

  const rawLatitude = typeof location.latitude === 'string' ? Number(location.latitude) : location.latitude;
  const rawLongitude = typeof location.longitude === 'string' ? Number(location.longitude) : location.longitude;

  if (!Number.isFinite(rawLatitude) || !Number.isFinite(rawLongitude)) {
    return {
      error: 'Location payload is missing valid latitude/longitude values'
    } as const;
  }

  return {
    value: {
      latitude: rawLatitude as number,
      longitude: rawLongitude as number,
      name: location.name?.trim() || undefined,
      address: location.address?.trim() || undefined
    }
  } as const;
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

  return payloadMessages.map((item) => {
    const normalized: NormalizedInboundMessage = {
      mobile: item.from,
      message: extractMessageText(item),
      messageId: item.id,
      messageType: item.type
    };

    if (item.type === 'location') {
      const parsedLocation = parseLocation(item.location);
      if ('error' in parsedLocation) {
        normalized.locationError = parsedLocation.error;
      } else {
        normalized.location = parsedLocation.value;
      }
    }

    return normalized;
  });
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
      const { mobile, message, messageId, messageType, location, locationError } = item;

      if (!mobile) {
        logger.warn('Skipping inbound WhatsApp payload without mobile identifier', {
          messageId,
          messageType
        });
        continue;
      }

      if (messageType === 'location') {
        logger.info('Inbound WhatsApp location message received', {
          from: mobile,
          messageId
        });

        if (locationError || !location) {
          logger.error('Unable to parse inbound WhatsApp location payload', {
            from: mobile,
            messageId,
            error: locationError ?? 'Unknown location parsing failure'
          });
          await messageQueue.enqueue({
            mobile,
            messageId,
            messageType,
            location: undefined,
            message: undefined
          });
          continue;
        }

        logger.info('Inbound WhatsApp location extracted', {
          from: mobile,
          messageId,
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name,
          address: location.address
        });

        messageQueue.enqueue({
          mobile,
          messageId,
          messageType,
          location,
          message
        });
        inboundMessagesCounter.labels('shared', 'keyword-router').inc();

        logger.info('Inbound WhatsApp location enqueued', {
          from: mobile,
          messageId,
          routingText: message,
          latitude: location.latitude,
          longitude: location.longitude
        });
        continue;
      }

      if (!message) {
        logger.warn('Skipping inbound WhatsApp payload without mobile or text body', {
          messageId,
          messageType,
          hasMobile: Boolean(mobile),
          hasTextBody: Boolean(message)
        });
        continue;
      }

      messageQueue.enqueue({ mobile, message, messageId });
      inboundMessagesCounter.labels('shared', 'keyword-router').inc();

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
