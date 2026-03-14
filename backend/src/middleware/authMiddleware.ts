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
  const apiKey = req.header('X-APP-KEY')
    ?? req.header('APP_API_KEY')
    ?? req.header('X-API-KEY')
    ?? req.header('Authorization')?.replace(/^Bearer\s+/i, '').trim();

  if (!apiKey) {
    return res.status(401).json({
      error: 'APP API key is required via X-APP-KEY, APP_API_KEY, X-API-KEY, or Authorization: Bearer <APP_API_KEY>'
    });
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
