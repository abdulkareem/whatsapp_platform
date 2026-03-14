import { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { whatsappService } from '../services/whatsappService';
import { normalizePhone } from '../utils/phoneFormatter';
import { otpService } from '../services/otpService';

export const messageController = {
  async sendMessage(req: Request, res: Response) {
    const { mobile, message } = req.body as { mobile?: string; message?: string };
    if (!mobile || !message) {
      return res.status(400).json({ error: 'mobile and message are required' });
    }

    const normalized = normalizePhone(mobile);
    const appKeyword = req.appContext?.keyword ?? 'SYSTEM';
    const response = await whatsappService.sendMessage(normalized, message);

    await prisma.messageLog.create({
      data: {
        mobile: normalized,
        message,
        direction: 'outgoing',
        app: appKeyword,
        status: 'sent',
        providerMessageId: response?.messages?.[0]?.id
      }
    });

    return res.status(200).json({ success: true, provider: response });
  },

  async sendOtp(req: Request, res: Response) {
    const { mobile, app } = req.body as { mobile?: string; app?: string };
    if (!mobile || !app) {
      return res.status(400).json({ error: 'mobile and app are required' });
    }

    const result = await otpService.sendOTP(normalizePhone(mobile), app);
    return res.status(202).json({ success: true, ...result });
  },

  async getLogs(req: Request, res: Response) {
    const logs = await prisma.messageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return res.status(200).json(logs);
  }
};
