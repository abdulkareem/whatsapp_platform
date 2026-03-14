import { Request, Response } from 'express';
import { adminAuthService } from '../services/adminAuthService';

export const adminController = {
  async verifyOtp(req: Request, res: Response) {
    const { mobile, otp, deviceId } = req.body as {
      mobile?: string;
      otp?: string;
      deviceId?: string;
    };

    if (!mobile || !otp || !deviceId) {
      return res.status(400).json({ error: 'mobile, otp and deviceId are required' });
    }

    if (!adminAuthService.isAdminMobile(mobile)) {
      return res.status(403).json({ error: 'Only the configured admin number is allowed' });
    }

    const token = await adminAuthService.verifyOtp({ mobile, otp, deviceId });

    if (!token) {
      return res.status(401).json({ error: 'Invalid or expired OTP for this device' });
    }

    return res.status(200).json({ token, expiresIn: 'session' });
  }
};
