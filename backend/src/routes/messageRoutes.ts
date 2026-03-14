import { Router } from 'express';
import { messageController } from '../controllers/messageController';
import { authMiddleware } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

router.post('/send', authMiddleware, apiRateLimiter, messageController.sendMessage);
router.post('/otp/send', authMiddleware, apiRateLimiter, messageController.sendOtp);
router.get('/logs', messageController.getLogs);

export default router;
