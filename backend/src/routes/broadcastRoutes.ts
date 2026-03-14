import { Router } from 'express';
import { broadcastController } from '../controllers/broadcastController';
import { authMiddleware } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

router.post('/', authMiddleware, apiRateLimiter, broadcastController.create);

export default router;
