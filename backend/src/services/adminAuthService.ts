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

  async getLoginRequirement(mobile: string, deviceId: string) {
    const normalizedMobile = normalizePhone(mobile);

    const device = await prisma.adminDevicePin.findUnique({
      where: {
        mobile_deviceId: {
          mobile: normalizedMobile,
          deviceId
        }
      }
    });

    return {
      requiresWhatsappVerification: !device?.whatsappLinked,
      hasPin: Boolean(device?.pin)
    };
  },

  async issueWhatsAppOtp(adminMobile: string, deviceId: string) {
    const normalizedMobile = normalizePhone(adminMobile);
    const code = generateOTP(6);
    const expiresAt = addMinutes(new Date(), env.OTP_EXPIRY_MINUTES);

    await prisma.adminOtp.create({
      data: {
        mobile: normalizedMobile,
        deviceId,
        code,
        expiresAt
      }
    });

    return { code, expiresAt, normalizedMobile };
  },

  async verifyPin({ mobile, pin, deviceId }: { mobile: string; pin: string; deviceId: string }) {
    const normalizedMobile = normalizePhone(mobile);

    const device = await prisma.adminDevicePin.findUnique({
      where: {
        mobile_deviceId: {
          mobile: normalizedMobile,
          deviceId
        }
      }
    });

    if (!device || !device.whatsappLinked || device.pin !== pin) {
      return null;
    }

    await prisma.adminDevicePin.update({
      where: { id: device.id },
      data: { lastVerifiedAt: new Date() }
    });

    return this.issueToken();
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

    await prisma.adminDevicePin.upsert({
      where: {
        mobile_deviceId: {
          mobile: normalizedMobile,
          deviceId
        }
      },
      update: {
        pin: otp,
        whatsappLinked: true,
        lastVerifiedAt: new Date()
      },
      create: {
        mobile: normalizedMobile,
        deviceId,
        pin: otp,
        whatsappLinked: true,
        lastVerifiedAt: new Date()
      }
    });

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
