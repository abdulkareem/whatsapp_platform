import { addMinutes } from '../utils/time';
import { prisma } from '../database/prisma';
import { env } from '../config/env';
import { generateOTP } from '../utils/otpGenerator';
import { whatsappService } from './whatsappService';

export const otpService = {
  async sendOTP(mobile: string, app: string) {
    const code = generateOTP();
    const expiresAt = addMinutes(new Date(), env.OTP_EXPIRY_MINUTES);

    await prisma.otp.create({
      data: {
        mobile,
        code,
        app: app.toLowerCase(),
        expiresAt
      }
    });

    const message = `Your ${app} verification code is ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`;
    await whatsappService.sendMessage(mobile, message);
    return { mobile, app, expiresAt };
  }
};
