import { Request, Response, NextFunction } from 'express';
import { adminAuthService } from '../services/adminAuthService';

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('X-ADMIN-TOKEN');

  if (!token) {
    return res.status(401).json({ error: 'X-ADMIN-TOKEN header is required' });
  }

  if (!adminAuthService.isValidToken(token)) {
    return res.status(403).json({ error: 'Invalid admin token' });
  }

  next();
};
