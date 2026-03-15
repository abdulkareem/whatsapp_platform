import { prisma } from '../database/prisma';

export const tenantService = {
  create: (payload: { name: string; slug: string; timezone?: string }) =>
    prisma.tenant.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        timezone: payload.timezone ?? 'UTC'
      }
    }),

  list: () => prisma.tenant.findMany({ include: { apps: true, subscriptions: true } }),

  getBySlug: (slug: string) => prisma.tenant.findUnique({ where: { slug }, include: { apps: true } })
};
