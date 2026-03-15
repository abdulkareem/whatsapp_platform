import { Router } from 'express';
import { billingController } from '../controllers/billingController';

const router = Router();

router.get('/plans', billingController.plans);
router.post('/tenant/:tenantId/subscribe', billingController.subscribe);
router.post('/tenant/:tenantId/checkout', billingController.createCheckout);

export default router;
