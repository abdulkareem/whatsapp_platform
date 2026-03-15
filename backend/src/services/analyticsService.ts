import { prisma } from '../database/prisma';

export const analyticsService = {
  async tenantOverview(tenantId: number) {
    const [messages, contacts, campaigns, workflows] = await Promise.all([
      prisma.messageLog.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId } }),
      prisma.campaign.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.workflow.count({ where: { tenantId } })
    ]);

    return {
      messages,
      contacts,
      workflows,
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        delivered: campaign.deliveredCount,
        failed: campaign.failedCount
      }))
    };
  }
};
