import { prisma } from '../database/prisma';

export const workflowService = {
  create: (payload: { tenantId: number; appId?: number; name: string; triggerType: string; definition: unknown }) =>
    prisma.workflow.create({
      data: {
        tenantId: payload.tenantId,
        appId: payload.appId,
        name: payload.name,
        triggerType: payload.triggerType,
        definition: payload.definition as any
      }
    }),

  listByTenant: (tenantId: number) => prisma.workflow.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' } })
};
