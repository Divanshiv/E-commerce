import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  createGooglePayOrder,
  createCODOrder,
  handleWebhook,
  getPublicPaymentConfig,
} from '../controllers/payment.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// Public — no auth required
router.get('/config', getPublicPaymentConfig);

// Public webhook — NO auth, Razorpay signs the payload
router.post('/razorpay/webhook', handleWebhook);

// Authenticated routes
router.post('/razorpay/order', verifyToken, requireAuth, createRazorpayOrder);
router.post('/razorpay/verify', verifyToken, requireAuth, verifyPayment);
router.post('/google-pay/order', verifyToken, requireAuth, createGooglePayOrder);
router.post('/cod', verifyToken, requireAuth, createCODOrder);

export default router;
