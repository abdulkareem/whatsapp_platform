import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { metricsRegistry } from '../config/metrics';

export const analyticsController = {
  async overview(req: Request, res: Response) {
    const tenantId = Number(req.params.tenantId);
    const data = await analyticsService.tenantOverview(tenantId);
    res.json(data);
  },

  async metrics(_req: Request, res: Response) {
    res.set('Content-Type', metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  }
};
