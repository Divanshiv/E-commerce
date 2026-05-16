import { Router } from 'express';
import {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getCategories,
  getSearchSuggestions,
} from '../controllers/product.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/slug/:slug', getProductBySlug);
router.get('/suggestions', getSearchSuggestions);

export default router;
