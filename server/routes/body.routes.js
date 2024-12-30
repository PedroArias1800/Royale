import { Router } from 'express';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getBody, getBodys, createBody, updateBody } from '../controllers/body.controller.js';

const router = Router();

router.get('/api/body', authRequired, getBody);
router.get('/api/bodies', authRequired, getBodys);
router.post('/api/body', authRequired, createBody);
router.put('/api/body/:id', authRequired, updateBody);

export default router;