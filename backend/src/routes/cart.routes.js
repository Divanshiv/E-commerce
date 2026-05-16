import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
  clearCart,
  guestCart,
} from '../controllers/cart.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Guest cart operations
router.post('/guest', guestCart);

// Authenticated routes
router.get('/', verifyToken, getCart);
router.post('/items', verifyToken, addToCart);
router.put('/items/:itemId', verifyToken, updateCartItem);
router.delete('/items/:itemId', verifyToken, removeCartItem);
router.post('/apply-coupon', verifyToken, applyCoupon);
router.delete('/coupon', verifyToken, removeCoupon);
router.delete('/', verifyToken, clearCart);

export default router;
