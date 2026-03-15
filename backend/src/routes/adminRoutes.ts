import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { appController } from '../controllers/appController';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware';

const router = Router();

router.post('/send-otp', adminController.sendOtp);
router.post('/verify-otp', adminController.verifyOtp);
router.get('/queue/stats', adminAuthMiddleware, appController.queueStats);
router.get('/queue/failed', adminAuthMiddleware, appController.failedQueueJobs);

export default router;
