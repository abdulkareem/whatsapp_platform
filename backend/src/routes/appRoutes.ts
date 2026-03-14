import { Router } from 'express';
import { appController } from '../controllers/appController';

const router = Router();

router.get('/', appController.list);
router.post('/', appController.create);
router.post('/:id/rotate-key', appController.rotateApiKey);

export default router;
