import { Router } from 'express';
import { getCoupons } from '../controllers/coupon.controller.js';

const router = Router();

router.get('/', getCoupons);

export default router;
