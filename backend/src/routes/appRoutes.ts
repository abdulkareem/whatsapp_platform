import { Router } from 'express';
import { appController } from '../controllers/appController';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware';

const router = Router();

router.get('/', appController.list);
router.post('/', adminAuthMiddleware, appController.create);
router.post('/:id/rotate-key', adminAuthMiddleware, appController.rotateApiKey);

export default router;
