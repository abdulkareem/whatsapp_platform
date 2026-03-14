import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

router.get('/', webhookController.verifyWebhook);
router.post('/', webhookController.receiveWebhook);

export default router;
