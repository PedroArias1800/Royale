import { Router } from 'express';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getParfum, getParfums, createParfum, updateParfum } from '../controllers/parfum.controller.js';

const router = Router();

router.get('/api/parfum', authRequired, getParfum);
router.get('/api/parfums', authRequired, getParfums);
router.post('/api/parfum', authRequired, createParfum);
router.put('/api/parfum/:id', authRequired, updateParfum);

export default router;