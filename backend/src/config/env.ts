import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const rawEnv = {
  ...process.env,
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ?? process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN ?? process.env.WHATSAPP_ACCESS_TOKEN,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? process.env.ADMIN_LOGIN_EMAIL,
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_FROM,
  SMTP_HOST: process.env.SMTP_HOST ?? process.env.SMTP_SERVER,
  SMTP_PORT: process.env.SMTP_PORT ?? process.env.SMTP_SERVER_PORT,
  SMTP_USER: process.env.SMTP_USER ?? process.env.SMTP_USERNAME,
  SMTP_PASS: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD,
  SMTP_SECURE: process.env.SMTP_SECURE ?? process.env.SMTP_SSL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL
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
  ADMIN_EMAIL: z.string().email().default('abdulkareem.t@gmail.com'),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional()
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
