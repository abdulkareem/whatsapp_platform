import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';
import { webhookSignatureMiddleware } from '../middleware/webhookSignatureMiddleware';

const router = Router();

router.get('/', webhookController.verifyWebhook);
router.post('/', webhookSignatureMiddleware, webhookController.receiveWebhook);

export default router;
