import { Router } from 'express';
import { workflowController } from '../controllers/workflowController';

const router = Router();

router.get('/:tenantId', workflowController.listByTenant);
router.post('/', workflowController.create);

export default router;
