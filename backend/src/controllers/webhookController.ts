import { Request, Response } from 'express';
import { env } from '../config/env';
import { messageRouterService } from '../services/messageRouterService';
import { logger } from '../config/logger';
import type { WhatsAppInboundPayload } from '../types/shared';
import { adminAuthService } from '../services/adminAuthService';
import { whatsappService } from '../services/whatsappService';

const adminHiRegex = /^hi(?:\s+([a-zA-Z0-9_-]{6,64}))?$/i;

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

      if (!mobile || !message) {
        continue;
      }

      logger.info('Inbound WhatsApp message received', { from: mobile, text: message });

      try {
        const adminHiMatch = message.match(adminHiRegex);
        if (adminAuthService.isAdminMobile(mobile) && adminHiMatch) {
          const providedDeviceId = adminHiMatch[1];
          const deviceId = providedDeviceId ?? 'unknown-device';
          const { code } = await adminAuthService.issueWhatsAppOtp(mobile, deviceId);
          const otpMessage = `Your OTP for login is ${code}. Enter this 6-digit pin to continue.`;
          await whatsappService.sendMessage(mobile, otpMessage);
          continue;
        }

        await messageRouterService.routeIncomingMessage(mobile, message);
      } catch (error) {
        logger.error('Failed to route inbound message', { error, mobile, message });
      }
    }

    return res.sendStatus(200);
  }
};
