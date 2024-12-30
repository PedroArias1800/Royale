import { Router } from 'express';
import { postCart } from '../controllers/cart.controller.js';

const router = Router();

router.post('/cart', postCart);

export default router;
