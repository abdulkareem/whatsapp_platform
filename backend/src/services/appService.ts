import crypto from 'crypto';
import { prisma } from '../database/prisma';

export const appService = {
  listApps: () => prisma.app.findMany({ orderBy: { createdAt: 'desc' } }),

  createApp: async (name: string, keyword: string, endpoint: string, rateLimitRpm?: number) => prisma.app.create({
    data: {
      name,
      keyword: keyword.toUpperCase(),
      endpoint,
      apiKey: crypto.randomBytes(24).toString('hex'),
      rateLimitRpm
    }
  }),

  rotateApiKey: async (id: number) => prisma.app.update({
    where: { id },
    data: { apiKey: crypto.randomBytes(24).toString('hex') }
  }),

  findByKeyword: (keyword: string) => prisma.app.findUnique({ where: { keyword: keyword.toUpperCase() } }),

  findByApiKey: (apiKey: string) => prisma.app.findUnique({ where: { apiKey } })
};
