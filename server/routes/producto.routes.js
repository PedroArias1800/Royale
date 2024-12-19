import { Router } from 'express';
import { getProductId, getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/producto.controller.js';

const router = Router();

router.get('/product/:id', getProductId);
router.get('/product', getProducts);
router.post('/product', createProduct);
router.put('/product/:id', updateProduct);
router.delete('/product/:id', deleteProduct);

export default router;
