import { Router } from 'express';
import {
  signup,
  login,
  logout,
  getMe,
  googleCallback
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.post('/google-callback', googleCallback);

export default router;
