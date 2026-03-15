import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { env } from '../config/env';

interface AppRoutingConfigInput {
  tenantId?: number;
  sessionEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  keywordRequired?: boolean;
  defaultApp?: boolean;
  fallbackMessage?: string | null;
  rateLimitRpm?: number;
  endpoint?: string;
  name?: string;
  keyword?: string;
}

const normalizeEndpoint = (endpoint: string) => endpoint.trim();
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const resolveInternalWebhookUrl = () => {
  if (!env.WEBHOOK_BASE_URL) return null;

  try {
    return new URL('/webhook', env.WEBHOOK_BASE_URL).toString();
  } catch {
    return null;
  }
};

const assertEndpointIsNotInternalWebhook = (endpoint: string) => {
  const internalWebhookUrl = resolveInternalWebhookUrl();
  if (!internalWebhookUrl) return;

  if (normalizeEndpoint(endpoint) === internalWebhookUrl) {
    throw new Error('App endpoint cannot be the platform webhook URL. Use your app callback URL instead.');
  }
};

export const appService = {
  listApps: () => prisma.app.findMany({ orderBy: { createdAt: 'desc' } }),

  createApp: async (name: string, keyword: string, endpoint: string, config: AppRoutingConfigInput = {}) => {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    assertEndpointIsNotInternalWebhook(normalizedEndpoint);
    const normalizedKeyword = keyword.toUpperCase();
    const slug = slugify(config.name ?? name ?? normalizedKeyword);

    const data = {
      name,
      keyword: normalizedKeyword,
      slug,
      webhookPath: `/app/${slug}`,
      endpoint: normalizedEndpoint,
      apiKey: crypto.randomBytes(24).toString('hex'),
      ...config
    };

    if (data.defaultApp) {
      await prisma.app.updateMany({ data: { defaultApp: false } });
    }

    return prisma.app.create({ data });
  },

  updateAppConfig: async (id: number, config: AppRoutingConfigInput) => {
    if (config.defaultApp) {
      await prisma.app.updateMany({ where: { id: { not: id } }, data: { defaultApp: false } });
    }

    const updateData = {
      ...config,
      keyword: config.keyword?.toUpperCase(),
      endpoint: config.endpoint ? normalizeEndpoint(config.endpoint) : undefined,
      slug: config.name ? slugify(config.name) : undefined
    };

    if (updateData.endpoint) {
      assertEndpointIsNotInternalWebhook(updateData.endpoint);
    }

    return prisma.app.update({ where: { id }, data: updateData });
  },

  rotateApiKey: async (id: number) => prisma.app.update({
    where: { id },
    data: { apiKey: crypto.randomBytes(24).toString('hex') }
  }),

  updateStatus: async (id: number, isActive: boolean) => prisma.app.update({
    where: { id },
    data: { isActive }
  }),

  deleteApp: async (id: number) => prisma.app.delete({ where: { id } }),

  findByKeyword: (keyword: string) => prisma.app.findUnique({ where: { keyword: keyword.toUpperCase() } }),

  findDefaultApp: () => prisma.app.findFirst({ where: { defaultApp: true } }),

  findByApiKey: (apiKey: string) => prisma.app.findUnique({ where: { apiKey } }),

  findBySlug: (slug: string) => prisma.app.findFirst({ where: { slug } })
};
