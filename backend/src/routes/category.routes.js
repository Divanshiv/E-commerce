import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', protect, authorize('admin', 'super-admin'), createCategory);
router.put('/:id', protect, authorize('admin', 'super-admin'), updateCategory);
router.delete('/:id', protect, authorize('admin', 'super-admin'), deleteCategory);

export default router;
