import { Request, Response } from 'express';
import { adminAuthService } from '../services/adminAuthService';

export const adminController = {
  login(req: Request, res: Response) {
    const { pin } = req.body as { pin?: string };

    if (!pin) {
      return res.status(400).json({ error: 'pin is required' });
    }

    if (!adminAuthService.verifyPin(pin)) {
      return res.status(401).json({ error: 'Invalid WhatsApp admin PIN' });
    }

    const token = adminAuthService.issueToken();

    return res.status(200).json({
      token,
      expiresIn: 'session'
    });
  }
};
