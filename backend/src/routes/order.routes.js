import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder
} from '../controllers/order.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requireAuth, getOrders);
router.get('/:id', verifyToken, requireAuth, getOrder);
router.post('/', verifyToken, requireAuth, createOrder);

export default router;
