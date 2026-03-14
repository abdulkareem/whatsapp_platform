import { Request, Response } from 'express';
import { broadcastService } from '../services/broadcastService';

export const broadcastController = {
  async create(req: Request, res: Response) {
    const { mobiles, message } = req.body as { mobiles?: string[]; message?: string };

    if (!mobiles?.length || !message) {
      return res.status(400).json({ error: 'mobiles array and message are required' });
    }

    const result = await broadcastService.enqueueBroadcast(mobiles, message, req.appContext?.keyword);
    return res.status(202).json(result);
  }
};
