import { Router } from 'express';
import { tenantController } from '../controllers/tenantController';

const router = Router();

router.get('/', tenantController.list);
router.post('/', tenantController.create);

export default router;
