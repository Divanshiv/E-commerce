import { Router } from 'express';
import { getBrands } from '../controllers/brand.controller.js';

const router = Router();

router.get('/', getBrands);

export default router;
