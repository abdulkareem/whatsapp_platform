import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  WHATSAPP_PHONE_ID: z.string().min(1),
  WHATSAPP_TOKEN: z.string().min(1),
  VERIFY_TOKEN: z.string().min(1),
  WEBHOOK_BASE_URL: z.string().optional(),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(10),
  DEFAULT_RATE_LIMIT_RPM: z.coerce.number().default(100)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
