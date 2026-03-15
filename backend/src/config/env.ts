import dotenv from 'dotenv';
import { createHash } from 'crypto';
import { z } from 'zod';

dotenv.config();

const DEFAULT_DATABASE_PUBLIC_URL =
  'postgresql://postgres:ArWbgvYQnKhfsvFcSsDnwEBBhdMIuNnM@tramway.proxy.rlwy.net:58990/railway';

const cleanEnvValue = (value?: string) => {
  if (!value) return value;
  return value.replace(/\\n/g, '').trim();
};

const isRailwayInternalPostgresUrl = (value?: string) => {
  if (!value) return false;

  try {
    return new URL(value).hostname.endsWith('.railway.internal');
  } catch {
    return value.includes('railway.internal');
  }
};

const buildPostgresUrlFromParts = (
  user?: string,
  password?: string,
  host?: string,
  port?: string,
  database?: string
) => {
  if (!user || !host || !port || !database) return undefined;

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password ?? '');

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
};

const resolveDatabaseUrl = () => {
  const databaseUrl = cleanEnvValue(process.env.DATABASE_URL);

  const fallbackCandidates = [
    process.env.DATABASE_PUBLIC_URL,
    process.env.DATABASE_URL_PUBLIC,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PUBLIC_URL,
    process.env.DATABASE_PRIVATE_URL,
    DEFAULT_DATABASE_PUBLIC_URL,
    buildPostgresUrlFromParts(
      cleanEnvValue(process.env.PGUSER),
      cleanEnvValue(process.env.PGPASSWORD),
      cleanEnvValue(process.env.PGHOST),
      cleanEnvValue(process.env.PGPORT),
      cleanEnvValue(process.env.PGDATABASE)
    ),
    buildPostgresUrlFromParts(
      cleanEnvValue(process.env.POSTGRES_USER),
      cleanEnvValue(process.env.POSTGRES_PASSWORD),
      cleanEnvValue(process.env.POSTGRES_HOST),
      cleanEnvValue(process.env.POSTGRES_PORT),
      cleanEnvValue(process.env.POSTGRES_DB)
    )
  ].map(cleanEnvValue);

  if (!databaseUrl) {
    return fallbackCandidates.find(Boolean);
  }

  const isRailwayRuntime = Boolean(process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_ENVIRONMENT_ID);

  if (!isRailwayRuntime && isRailwayInternalPostgresUrl(databaseUrl)) {
    return fallbackCandidates.find(Boolean) ?? databaseUrl;
  }

  return databaseUrl;
};

const resolveAdminTokenSecret = () => {
  const configuredSecret = cleanEnvValue(process.env.ADMIN_TOKEN_SECRET ?? process.env.JWT_SECRET);

  if (configuredSecret) return configuredSecret;

  const seed = [
    cleanEnvValue(process.env.WHATSAPP_TOKEN ?? process.env.WHATSAPP_ACCESS_TOKEN),
    cleanEnvValue(process.env.VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN),
    cleanEnvValue(process.env.ADMIN_EMAIL ?? process.env.ADMIN_LOGIN_EMAIL),
    'whatsapp-platform'
  ]
    .filter(Boolean)
    .join(':');

  return createHash('sha256').update(seed).digest('hex');
};

const rawEnv = {
  ...process.env,
  DATABASE_URL: resolveDatabaseUrl(),
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ?? process.env.WHATSAPP_PHONE_NUMBER_ID ?? process.env.PHONE_NUMBER_ID,
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
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  ADMIN_TOKEN_SECRET: resolveAdminTokenSecret(),
  JWT_SECRET: process.env.JWT_SECRET ?? resolveAdminTokenSecret(),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  REDIS_URL: process.env.REDIS_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  PLATFORM_BASE_URL: process.env.PLATFORM_BASE_URL
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
  ADMIN_TOKEN_SECRET: z.string().min(16),
  JWT_SECRET: z.string().min(16),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  QUEUE_WORKER_CONCURRENCY: z.coerce.number().default(100),
  QUEUE_RETRY_ATTEMPTS: z.coerce.number().default(3),
  SESSION_TIMEOUT_MINUTES: z.coerce.number().default(15),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  PLATFORM_BASE_URL: z.string().optional()
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
