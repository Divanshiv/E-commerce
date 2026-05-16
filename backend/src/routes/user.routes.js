import { Router } from 'express';
import { updateProfile, addAddress, deleteAddress } from '../controllers/auth.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.put('/profile', verifyToken, requireAuth, updateProfile);
router.post('/addresses', verifyToken, requireAuth, addAddress);
router.delete('/addresses/:addressId', verifyToken, requireAuth, deleteAddress);

export default router;
