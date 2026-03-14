import { Request, Response, NextFunction } from 'express';
import { appService } from '../services/appService';

declare global {
  namespace Express {
    interface Request {
      appContext?: {
        id: number;
        name: string;
        keyword: string;
        rateLimitRpm: number;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-APP-KEY');

  if (!apiKey) {
    return res.status(401).json({ error: 'X-APP-KEY header is required' });
  }

  const app = await appService.findByApiKey(apiKey);

  if (!app || !app.isActive) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  req.appContext = {
    id: app.id,
    name: app.name,
    keyword: app.keyword,
    rateLimitRpm: app.rateLimitRpm
  };

  next();
};
