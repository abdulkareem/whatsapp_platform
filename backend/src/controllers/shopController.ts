import { Request, Response } from 'express';
import { shopDashboardService } from '../services/shopDashboardService';

export const shopController = {
  async overview(req: Request, res: Response) {
    const tenantId = req.shopContext?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Missing shop auth context' });
    }

    const data = await shopDashboardService.getOverview(tenantId);
    return res.status(200).json(data);
  },

  async campaigns(req: Request, res: Response) {
    const tenantId = req.shopContext?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Missing shop auth context' });
    }

    const data = await shopDashboardService.listCampaigns(tenantId);
    return res.status(200).json(data);
  },

  async createCampaign(req: Request, res: Response) {
    const tenantId = req.shopContext?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Missing shop auth context' });
    }

    const { name, templateName, variables = [], audienceCount, scheduledAt, tags = [] } = req.body as {
      name?: string;
      templateName?: string;
      variables?: string[];
      audienceCount?: number;
      scheduledAt?: string;
      tags?: string[];
    };

    if (!name || !templateName || !audienceCount || audienceCount < 1) {
      return res.status(400).json({ error: 'name, templateName, and audienceCount are required' });
    }

    const result = await shopDashboardService.createCampaign(tenantId, {
      name,
      templateName,
      variables,
      audienceCount,
      scheduledAt,
      tags
    });

    if ('error' in result) {
      return res.status(402).json(result);
    }

    return res.status(201).json(result);
  },

  async topupCredits(req: Request, res: Response) {
    const tenantId = req.shopContext?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Missing shop auth context' });
    }

    const { amount } = req.body as { amount?: number };
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'amount must be >= 1' });
    }

    const wallet = await shopDashboardService.topupCredits(tenantId, amount);
    return res.status(200).json(wallet);
  }
};
