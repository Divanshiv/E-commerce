import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist
} from '../controllers/wishlist.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// Authenticated routes
router.get('/', verifyToken, requireAuth, getWishlist);
router.post('/:productId', verifyToken, requireAuth, addToWishlist);
router.delete('/:productId', verifyToken, requireAuth, removeFromWishlist);
router.post('/toggle/:productId', verifyToken, toggleWishlist);

export default router;
