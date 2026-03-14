import { Request, Response } from 'express';
import { adminAuthService } from '../services/adminAuthService';
import { emailService } from '../services/emailService';
import { logger } from '../config/logger';

export const adminController = {
  async sendOtp(req: Request, res: Response) {
    const { email } = req.body as { email?: string };

    logger.info('Admin OTP request received', {
      email,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    if (!adminAuthService.isAdminEmail(email)) {
      return res.status(403).json({ error: 'Only the configured admin email is allowed' });
    }

    try {
      const { code, expiresAt, normalizedEmail } = await adminAuthService.issueEmailOtp(email);

      logger.info('Admin OTP generated', {
        email: normalizedEmail,
        otp: code,
        expiresAt
      });

      await emailService.sendOtp(normalizedEmail, code);

      return res.status(200).json({ message: 'OTP sent successfully', expiresAt });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP email';
      logger.error('Admin OTP send failed', {
        email,
        errorMessage: message,
        errorStack: error instanceof Error ? error.stack : undefined
      });
      return res.status(500).json({ error: message });
    }
  },

  async verifyOtp(req: Request, res: Response) {
    const { email, otp } = req.body as {
      email?: string;
      otp?: string;
    };

    if (!email || !otp) {
      return res.status(400).json({ error: 'email and otp are required' });
    }

    if (!adminAuthService.isAdminEmail(email)) {
      return res.status(403).json({ error: 'Only the configured admin email is allowed' });
    }

    const token = await adminAuthService.verifyOtp({ email, otp });

    if (!token) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    return res.status(200).json({ token, expiresIn: 'session' });
  }
};
