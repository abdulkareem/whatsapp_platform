import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { env } from '../config/env';
import { addMinutes } from '../utils/time';
import { generateOTP } from '../utils/otpGenerator';

const activeTokens = new Set<string>();

export const adminAuthService = {
  isAdminEmail(email: string) {
    return email.trim().toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  },

  async issueEmailOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const code = generateOTP(6);
    const expiresAt = addMinutes(new Date(), env.OTP_EXPIRY_MINUTES);

    await prisma.otp.create({
      data: {
        mobile: normalizedEmail,
        code,
        app: 'admin',
        expiresAt
      }
    });

    return { code, expiresAt, normalizedEmail };
  },

  async verifyOtp({ email, otp }: { email: string; otp: string }) {
    const normalizedEmail = email.trim().toLowerCase();

    const record = await prisma.otp.findFirst({
      where: {
        mobile: normalizedEmail,
        code: otp,
        app: 'admin',
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return null;
    }

    await prisma.otp.update({ where: { id: record.id }, data: { used: true } });

    return this.issueToken();
  },

  issueToken() {
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    return token;
  },

  isValidToken(token: string) {
    return activeTokens.has(token);
  }
};
