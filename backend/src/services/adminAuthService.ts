import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { env } from '../config/env';
import { addMinutes } from '../utils/time';
import { generateOTP } from '../utils/otpGenerator';
import { normalizePhone } from '../utils/phoneFormatter';

const activeTokens = new Set<string>();

export const adminAuthService = {
  isAdminMobile(mobile: string) {
    return normalizePhone(mobile) === normalizePhone(env.ADMIN_WHATSAPP_NUMBER);
  },

  async issueWhatsAppOtp(adminMobile: string, deviceId: string) {
    const code = generateOTP(6);
    const expiresAt = addMinutes(new Date(), env.OTP_EXPIRY_MINUTES);

    await prisma.adminOtp.create({
      data: {
        mobile: normalizePhone(adminMobile),
        deviceId,
        code,
        expiresAt
      }
    });

    return { code, expiresAt };
  },

  async verifyOtp({ mobile, otp, deviceId }: { mobile: string; otp: string; deviceId: string }) {
    const normalizedMobile = normalizePhone(mobile);

    const record = await prisma.adminOtp.findFirst({
      where: {
        mobile: normalizedMobile,
        deviceId,
        code: otp,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return null;
    }

    await prisma.adminOtp.update({ where: { id: record.id }, data: { used: true } });

    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    return token;
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
