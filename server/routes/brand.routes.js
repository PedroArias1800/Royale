import { Router } from 'express';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getBrand, getBrands, createBrand, updateBrand } from '../controllers/brand.controller.js';

const router = Router();

router.get('/api/brand', authRequired, getBrand);
router.get('/api/brands', authRequired, getBrands);
router.post('/api/brand', authRequired, createBrand);
router.put('/api/brand/:id', authRequired, updateBrand);

export default router;
