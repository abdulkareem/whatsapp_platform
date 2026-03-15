import { Request, Response } from 'express';
import { billingService } from '../services/billingService';

export const billingController = {
  plans(_req: Request, res: Response) {
    res.json(billingService.getPlans());
  },

  async subscribe(req: Request, res: Response) {
    const tenantId = Number(req.params.tenantId);
    const { plan } = req.body as { plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE' };
    const subscription = await billingService.upsertSubscription(tenantId, plan);
    res.json(subscription);
  },

  async createCheckout(req: Request, res: Response) {
    const tenantId = Number(req.params.tenantId);
    const { priceId, successUrl, cancelUrl } = req.body;
    const session = await billingService.createStripeCheckoutSession(tenantId, priceId, successUrl, cancelUrl);
    res.json({ id: session.id, url: session.url });
  }
};
