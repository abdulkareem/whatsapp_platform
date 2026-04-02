import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { whatsappService } from '../services/whatsappService';
import { normalizePhone } from '../utils/phoneFormatter';
import { otpService } from '../services/otpService';
import { logger } from '../config/logger';

const sendTextMessageSchema = z.object({
  type: z.literal('text').optional(),
  mobile: z.string().trim().min(5),
  countryCode: z.string().trim().min(1).optional(),
  message: z.string().trim().min(1).max(4096)
});

const sendLocationMessageSchema = z.object({
  type: z.literal('location'),
  mobile: z.string().trim().min(5),
  countryCode: z.string().trim().min(1).optional(),
  latitude: z.coerce.number().finite(),
  longitude: z.coerce.number().finite(),
  name: z.string().trim().min(1).max(256).optional(),
  address: z.string().trim().min(1).max(512).optional()
});

const sendMessageSchema = z.union([sendTextMessageSchema, sendLocationMessageSchema]);

const sendOtpSchema = z.object({
  mobile: z.string().trim().min(5),
  countryCode: z.string().trim().min(1).optional(),
  app: z.string().trim().min(1)
});

export const messageController = {
  async sendMessage(req: Request, res: Response) {
    const parsed = sendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors
      });
    }

    const normalized = normalizePhone(parsed.data.mobile, parsed.data.countryCode);
    const appKeyword = req.appContext?.keyword ?? 'SYSTEM';

    const provider =
      parsed.data.type === 'location'
        ? await whatsappService.sendLocation(normalized, {
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
            name: parsed.data.name,
            address: parsed.data.address
          })
        : await whatsappService.sendMessage(normalized, parsed.data.message);
    const providerMessageId = provider?.messages?.[0]?.id;

    await prisma.messageLog.create({
      data: {
        mobile: normalized,
        message:
          parsed.data.type === 'location'
            ? JSON.stringify({
                type: 'location',
                latitude: parsed.data.latitude,
                longitude: parsed.data.longitude,
                name: parsed.data.name,
                address: parsed.data.address
              })
            : parsed.data.message,
        direction: 'outgoing',
        app: appKeyword,
        status: 'sent',
        providerMessageId
      }
    });

    logger.info('Outbound message logged', {
      appId: req.appContext?.id ?? null,
      appKeyword,
      mobile: normalized,
      providerMessageId: providerMessageId ?? null
    });

    return res.status(200).json({ success: true, provider });
  },

  async sendOtp(req: Request, res: Response) {
    const parsed = sendOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors
      });
    }

    const { mobile, countryCode, app } = parsed.data;
    const result = await otpService.sendOTP(normalizePhone(mobile, countryCode), app);
    return res.status(202).json({ success: true, ...result });
  },

  async getLogs(req: Request, res: Response) {
    const logs = await prisma.messageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return res.status(200).json(logs);
  }
};
