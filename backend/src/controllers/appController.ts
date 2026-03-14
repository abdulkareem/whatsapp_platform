import { Request, Response } from 'express';
import { appService } from '../services/appService';

export const appController = {
  async list(req: Request, res: Response) {
    const apps = await appService.listApps();
    return res.status(200).json(apps);
  },

  async create(req: Request, res: Response) {
    const { name, keyword, endpoint, rateLimitRpm } = req.body as {
      name?: string;
      keyword?: string;
      endpoint?: string;
      rateLimitRpm?: number;
    };

    if (!name || !keyword || !endpoint) {
      return res.status(400).json({ error: 'name, keyword and endpoint are required' });
    }

    const app = await appService.createApp(name, keyword, endpoint, rateLimitRpm);
    return res.status(201).json(app);
  },

  async rotateApiKey(req: Request, res: Response) {
    const id = Number(req.params.id);
    const app = await appService.rotateApiKey(id);
    return res.status(200).json(app);
  }
};
