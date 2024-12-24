import { Router } from 'express';
import { postCart } from '../controllersPg/cart.controller.pg.js';

const router = Router();

router.post('/cart', postCart);

export default router;
