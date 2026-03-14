import { Request, Response } from 'express';
import { adminAuthService } from '../services/adminAuthService';

export const adminController = {
  async loginRequirement(req: Request, res: Response) {
    const { mobile, deviceId } = req.body as {
      mobile?: string;
      deviceId?: string;
    };

    if (!mobile || !deviceId) {
      return res.status(400).json({ error: 'mobile and deviceId are required' });
    }

    if (!adminAuthService.isAdminMobile(mobile)) {
      return res.status(403).json({ error: 'Only the configured admin number is allowed' });
    }

    const requirement = await adminAuthService.getLoginRequirement(mobile, deviceId);
    return res.status(200).json(requirement);
  },

  async verifyPin(req: Request, res: Response) {
    const { mobile, pin, deviceId } = req.body as {
      mobile?: string;
      pin?: string;
      deviceId?: string;
    };

    if (!mobile || !pin || !deviceId) {
      return res.status(400).json({ error: 'mobile, pin and deviceId are required' });
    }

    if (!adminAuthService.isAdminMobile(mobile)) {
      return res.status(403).json({ error: 'Only the configured admin number is allowed' });
    }

    const token = await adminAuthService.verifyPin({ mobile, pin, deviceId });

    if (!token) {
      return res.status(401).json({ error: 'Invalid pin for this device' });
    }

    return res.status(200).json({ token, expiresIn: 'session' });
  },

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
