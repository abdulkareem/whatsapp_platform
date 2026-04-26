import { prisma } from '../database/prisma';

const normalizeTemplateVariables = (variables: string[]) => variables.map((item) => item.trim()).filter(Boolean);

export const shopDashboardService = {
  async getOverview(tenantId: number) {
    const [tenant, wallet, contactsTotal, optOutTotal, campaigns, deliveredCount, readCount] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.shopCreditWallet.findUnique({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId, optOutStatus: true } }),
      prisma.campaign.count({ where: { tenantId } }),
      prisma.messageLog.count({ where: { tenantId, status: 'delivered' } }),
      prisma.messageLog.count({ where: { tenantId, status: 'read' } })
    ]);

    return {
      shop: tenant,
      credits: wallet?.balance ?? 0,
      contactsTotal,
      optOutTotal,
      campaigns,
      deliveredCount,
      readCount
    };
  },

  async listCampaigns(tenantId: number) {
    return prisma.campaign.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 25 });
  },

  async createCampaign(tenantId: number, payload: {
    name: string;
    templateName: string;
    variables: string[];
    audienceCount: number;
    scheduledAt?: string;
    tags?: string[];
  }) {
    const wallet = await prisma.shopCreditWallet.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId, balance: 10 }
    });

    if (wallet.balance < payload.audienceCount) {
      return { error: 'Insufficient Credits', credits: wallet.balance } as const;
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        name: payload.name,
        templateName: payload.templateName,
        status: payload.scheduledAt ? 'SCHEDULED' : 'PROCESSING',
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        recipientCount: payload.audienceCount,
        metadata: {
          templateVariables: normalizeTemplateVariables(payload.variables ?? []),
          tags: payload.tags ?? []
        }
      }
    });

    await prisma.shopCreditWallet.update({
      where: { tenantId },
      data: { balance: { decrement: payload.audienceCount } }
    });

    return { campaign, creditsRemaining: wallet.balance - payload.audienceCount } as const;
  },

  async topupCredits(tenantId: number, amount: number) {
    const wallet = await prisma.shopCreditWallet.upsert({
      where: { tenantId },
      update: { balance: { increment: amount } },
      create: { tenantId, balance: 10 + amount }
    });

    return wallet;
  }
};
