import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { whatsappService } from '../services/whatsappService';
import { normalizePhone } from '../utils/phoneFormatter';
import { otpService } from '../services/otpService';
import { logger } from '../config/logger';

const sendMessageSchema = z.object({
  mobile: z.string().trim().min(5),
  message: z.string().trim().min(1).max(4096)
});

const sendOtpSchema = z.object({
  mobile: z.string().trim().min(5),
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

    const { mobile, message } = parsed.data;
    const normalized = normalizePhone(mobile);
    const appKeyword = req.appContext?.keyword ?? 'SYSTEM';
    const provider = await whatsappService.sendMessage(normalized, message);
    const providerMessageId = provider?.messages?.[0]?.id;

    await prisma.messageLog.create({
      data: {
        mobile: normalized,
        message,
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

    const { mobile, app } = parsed.data;
    const result = await otpService.sendOTP(normalizePhone(mobile), app);
    return res.status(202).json({ success: true, ...result });
  },

  async getLogs(req: Request, res: Response) {
    const logs = await prisma.messageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return res.status(200).json(logs);
  }
};
