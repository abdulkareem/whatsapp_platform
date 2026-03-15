import { createHmac, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const webhookSignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    next();
    return;
  }

  const signature = req.header('x-hub-signature-256');
  if (!signature || !signature.startsWith('sha256=')) {
    res.status(401).json({ error: 'Missing webhook signature' });
    return;
  }

  const rawBody = JSON.stringify(req.body);
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!isValid) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  next();
};
