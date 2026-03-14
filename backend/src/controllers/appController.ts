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

    const normalizedName = name?.trim();
    const normalizedKeyword = keyword?.trim();
    const normalizedEndpoint = endpoint?.trim();

    if (!normalizedName || !normalizedKeyword || !normalizedEndpoint) {
      return res.status(400).json({ error: 'name, keyword and endpoint are required' });
    }

    if (rateLimitRpm !== undefined && (!Number.isInteger(rateLimitRpm) || rateLimitRpm <= 0)) {
      return res.status(400).json({ error: 'rateLimitRpm must be a positive integer' });
    }

    const app = await appService.createApp(normalizedName, normalizedKeyword, normalizedEndpoint, rateLimitRpm);
    return res.status(201).json(app);
  },

  async rotateApiKey(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id param must be a positive integer' });
    }

    const app = await appService.rotateApiKey(id);
    return res.status(200).json(app);
  }
};
