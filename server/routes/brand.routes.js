import { Router } from 'express';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getBrand, getBrands, getAllBrands, createBrand, updateBrand, deleteBrand } from '../controllers/brand.controller.js';

const router = Router();

router.get('/api/brand', authRequired, getBrand);
router.get('/api/brands', authRequired, getBrands);
router.get('/api/brands/all', authRequired, getAllBrands);
router.post('/api/brand', authRequired, createBrand);
router.put('/api/brand/:id', authRequired, updateBrand);
router.delete('/api/brand/:id', authRequired, deleteBrand);

export default router;
