import { NextFunction, Request, Response } from 'express';
import { shopAuthService } from '../services/shopAuthService';

declare global {
  namespace Express {
    interface Request {
      shopContext?: {
        tenantId: number;
        mobile: string;
      };
    }
  }
}

export const shopAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('X-SHOP-TOKEN') ?? req.header('Authorization')?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({ error: 'X-SHOP-TOKEN header is required' });
  }

  const payload = shopAuthService.validateToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid shop token' });
  }

  req.shopContext = { tenantId: payload.tenantId, mobile: payload.mobile };
  next();
};
