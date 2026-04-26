import { Router } from 'express';
import { shopAuthMiddleware } from '../middleware/shopAuthMiddleware';
import { shopController } from '../controllers/shopController';

const router = Router();

router.get('/overview', shopAuthMiddleware, shopController.overview);
router.get('/campaigns', shopAuthMiddleware, shopController.campaigns);
router.post('/campaigns', shopAuthMiddleware, shopController.createCampaign);
router.post('/credits/topup', shopAuthMiddleware, shopController.topupCredits);

export default router;
