import { createHmac } from 'crypto';
import { Request, Response } from 'express';
import { env } from '../config/env';

const base64Url = (input: string) => Buffer.from(input).toString('base64url');

export const authController = {
  login(req: Request, res: Response) {
    const { email, tenantId = 1 } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({ sub: email, tenantId, role: 'admin', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 }));
    const signature = createHmac('sha256', env.JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    const token = `${header}.${payload}.${signature}`;

    return res.json({ token });
  }
};
