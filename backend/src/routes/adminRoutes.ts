import { Router } from 'express';
import { adminController } from '../controllers/adminController';

const router = Router();

router.post('/login-requirement', adminController.loginRequirement);
router.post('/verify-pin', adminController.verifyPin);
router.post('/verify-otp', adminController.verifyOtp);

export default router;
