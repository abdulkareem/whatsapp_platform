import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { env } from '../config/env';
import { normalizePhone } from '../utils/phoneFormatter';
import { otpService } from './otpService';

const ONE_DAY_SECONDS = 60 * 60 * 24;

type ShopTokenPayload = {
  iat: number;
  exp: number;
  tenantId: number;
  mobile: string;
  role: 'shop_owner';
};

const toBase64Url = (value: string) => Buffer.from(value).toString('base64url');
const fromBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf-8');
const sign = (input: string) => crypto.createHmac('sha256', env.JWT_SECRET).update(input).digest('base64url');

const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const issueToken = (payload: Omit<ShopTokenPayload, 'iat' | 'exp' | 'role'>) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload: ShopTokenPayload = {
    iat: nowSeconds,
    exp: nowSeconds + ONE_DAY_SECONDS,
    role: 'shop_owner',
    ...payload
  };
  const encoded = toBase64Url(JSON.stringify(fullPayload));
  return `${encoded}.${sign(encoded)}`;
};

const parseToken = (token: string): ShopTokenPayload | null => {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  if (!safeEqual(sign(encoded), signature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as ShopTokenPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000) || payload.role !== 'shop_owner') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

const slugForMobile = (mobile: string) => `shop-${mobile.slice(-10)}`;

export const shopAuthService = {
  async sendOtp(rawMobile: string) {
    const mobile = normalizePhone(rawMobile);
    return otpService.sendOTP(mobile, 'shop');
  },

  async verifyOtp(rawMobile: string, otp: string) {
    const mobile = normalizePhone(rawMobile);
    const record = await prisma.otp.findFirst({
      where: {
        mobile,
        code: otp,
        app: 'shop',
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return null;
    }

    await prisma.otp.update({ where: { id: record.id }, data: { used: true } });

    const slug = slugForMobile(mobile);
    const tenant = await prisma.tenant.upsert({
      where: { slug },
      update: { updatedAt: new Date() },
      create: { slug, name: `Shop ${mobile.slice(-4)}` }
    });

    await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: `${mobile}@shop.local`
        }
      },
      update: { name: `Owner ${mobile.slice(-4)}`, isActive: true },
      create: {
        tenantId: tenant.id,
        email: `${mobile}@shop.local`,
        name: `Owner ${mobile.slice(-4)}`,
        role: 'owner',
        isActive: true
      }
    });

    await prisma.shopCreditWallet.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: { tenantId: tenant.id, balance: 10 }
    });

    const token = issueToken({ tenantId: tenant.id, mobile });
    return { token, tenantId: tenant.id, mobile };
  },

  validateToken(token: string) {
    return parseToken(token);
  }
};
