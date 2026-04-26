import { Router } from 'express';
import { shopAuthController } from '../controllers/shopAuthController';

const router = Router();

router.post('/send-otp', shopAuthController.sendOtp);
router.post('/verify-otp', shopAuthController.verifyOtp);

export default router;
