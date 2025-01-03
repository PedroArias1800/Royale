import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getBody, getBodies, createBody, updateBody } from '../controllers/body.controller.js';

const router = Router();

router.get('/api/body', authRequired, getBody);
router.get('/api/bodies', authRequired, getBodies);
router.post('/api/body', authRequired, upload.fields([{ name: 'img1' }, { name: 'img2' }]), createBody);
router.put('/api/body/:id', authRequired, upload.fields([{ name: 'img1' }, { name: 'img2' }]), updateBody);

export default router;