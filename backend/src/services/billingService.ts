import crypto from 'crypto';
import { prisma } from '../database/prisma';

const planMap = {
  FREE: { contactsLimit: 500, campaignLimit: 1000, aiTokenLimit: 10000, apiCallLimit: 50000 },
  STARTER: { contactsLimit: 3000, campaignLimit: 10000, aiTokenLimit: 100000, apiCallLimit: 500000 },
  BUSINESS: { contactsLimit: 25000, campaignLimit: 100000, aiTokenLimit: 500000, apiCallLimit: 2000000 },
  ENTERPRISE: { contactsLimit: 200000, campaignLimit: 1000000, aiTokenLimit: 3000000, apiCallLimit: 10000000 }
} as const;

export const billingService = {
  getPlans: () => planMap,

  async upsertSubscription(tenantId: number, plan: keyof typeof planMap) {
    const limits = planMap[plan];

    return prisma.subscription.upsert({
      where: { tenantId },
      create: { tenantId, plan, ...limits },
      update: { plan, ...limits }
    });
  },

  createStripeCheckoutSession: async (tenantId: number, priceId: string, successUrl: string, cancelUrl: string) => {
    return {
      id: crypto.randomUUID(),
      url: `${successUrl}?tenant=${tenantId}&price=${encodeURIComponent(priceId)}&cancel=${encodeURIComponent(cancelUrl)}`
    };
  }
};
