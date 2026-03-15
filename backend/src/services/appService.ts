import crypto from 'crypto';
import { prisma } from '../database/prisma';

interface AppRoutingConfigInput {
  sessionEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  keywordRequired?: boolean;
  defaultApp?: boolean;
  fallbackMessage?: string | null;
  rateLimitRpm?: number;
}

export const appService = {
  listApps: () => prisma.app.findMany({ orderBy: { createdAt: 'desc' } }),

  createApp: async (name: string, keyword: string, endpoint: string, config: AppRoutingConfigInput = {}) => {
    const data = {
      name,
      keyword: keyword.toUpperCase(),
      endpoint,
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

    return prisma.app.update({ where: { id }, data: config });
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

  findByApiKey: (apiKey: string) => prisma.app.findUnique({ where: { apiKey } })
};
