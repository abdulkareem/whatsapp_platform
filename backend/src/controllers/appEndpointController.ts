import { Request, Response } from 'express';
import { appService } from '../services/appService';

export const appEndpointController = {
  async receive(req: Request, res: Response) {
    const appSlug = req.params.slug;
    const app = await appService.findBySlug?.(appSlug);

    if (!app || !app.isActive) {
      return res.status(404).json({ error: 'App endpoint not found' });
    }

    return res.json({
      accepted: true,
      app: app.keyword,
      webhookPath: `/app/${appSlug}`,
      payload: req.body
    });
  }
};
