import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const rawEnv = {
  ...process.env,
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ?? process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN ?? process.env.WHATSAPP_ACCESS_TOKEN,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  WHATSAPP_PHONE_ID: z.string().min(1),
  WHATSAPP_TOKEN: z.string().min(1),
  VERIFY_TOKEN: z.string().min(1).default('Kareem@123'),
  WEBHOOK_BASE_URL: z.string().optional(),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(10),
  DEFAULT_RATE_LIMIT_RPM: z.coerce.number().default(100),
  CORS_ORIGINS: z.string().optional(),
  ADMIN_WHATSAPP_NUMBER: z.string().min(6).default('9747917623')
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
