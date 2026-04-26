import { Request, Response } from 'express';
import { shopAuthService } from '../services/shopAuthService';

export const shopAuthController = {
  async sendOtp(req: Request, res: Response) {
    const { mobile } = req.body as { mobile?: string };
    if (!mobile) {
      return res.status(400).json({ error: 'mobile is required' });
    }

    const result = await shopAuthService.sendOtp(mobile);
    return res.status(200).json(result);
  },

  async verifyOtp(req: Request, res: Response) {
    const { mobile, otp } = req.body as { mobile?: string; otp?: string };
    if (!mobile || !otp) {
      return res.status(400).json({ error: 'mobile and otp are required' });
    }

    const result = await shopAuthService.verifyOtp(mobile, otp);
    if (!result) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    return res.status(200).json(result);
  }
};
