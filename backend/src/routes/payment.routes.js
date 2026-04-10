import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  createCODOrder
} from '../controllers/payment.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/razorpay/order', verifyToken, requireAuth, createRazorpayOrder);
router.post('/razorpay/verify', verifyToken, requireAuth, verifyPayment);
router.post('/cod', verifyToken, requireAuth, createCODOrder);

export default router;
