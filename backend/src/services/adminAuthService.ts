import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { env } from '../config/env';
import { addMinutes } from '../utils/time';
import { generateOTP } from '../utils/otpGenerator';

const ONE_HOUR_SECONDS = 60 * 60;

type AdminTokenPayload = {
  iat: number;
  exp: number;
  nonce: string;
};

const toBase64Url = (value: string) => Buffer.from(value).toString('base64url');

const fromBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf-8');

const sign = (input: string) => crypto.createHmac('sha256', env.ADMIN_TOKEN_SECRET).update(input).digest('base64url');

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const createToken = () => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    iat: nowSeconds,
    exp: nowSeconds + ONE_HOUR_SECONDS,
    nonce: crypto.randomBytes(16).toString('hex')
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

const parsePayload = (encodedPayload: string) => {
  try {
    return JSON.parse(fromBase64Url(encodedPayload)) as AdminTokenPayload;
  } catch {
    return null;
  }
};

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
    return createToken();
  },

  isValidToken(token: string) {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      return false;
    }

    const expectedSignature = sign(encodedPayload);

    if (!safeEqual(expectedSignature, signature)) {
      return false;
    }

    const payload = parsePayload(encodedPayload);

    if (!payload || typeof payload.exp !== 'number') {
      return false;
    }

    return payload.exp > Math.floor(Date.now() / 1000);
  }
};
