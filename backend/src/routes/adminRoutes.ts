import { Router } from 'express';
import { adminController } from '../controllers/adminController';

const router = Router();

router.post('/send-otp', adminController.sendOtp);
router.post('/verify-otp', adminController.verifyOtp);

export default router;
