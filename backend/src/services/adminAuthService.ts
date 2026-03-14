import crypto from 'crypto';
import { env } from '../config/env';

const activeTokens = new Set<string>();

export const adminAuthService = {
  verifyPin(pin: string) {
    return pin === env.ADMIN_WHATSAPP_PIN;
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
