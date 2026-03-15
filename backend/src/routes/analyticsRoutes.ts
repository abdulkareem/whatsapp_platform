import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

router.get('/metrics', analyticsController.metrics);
router.get('/tenant/:tenantId/overview', analyticsController.overview);

export default router;
