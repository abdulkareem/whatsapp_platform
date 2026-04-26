import { Router } from 'express';
import { broadcastController } from '../controllers/broadcastController';
import { authMiddleware } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

router.post('/', authMiddleware, apiRateLimiter, broadcastController.create);
router.post('/sponsored/preview', authMiddleware, apiRateLimiter, broadcastController.previewSponsored);
router.post('/sponsored', authMiddleware, apiRateLimiter, broadcastController.createSponsored);

export default router;
