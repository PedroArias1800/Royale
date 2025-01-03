import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getType, getTypes, createType, updateType } from '../controllers/type.controller.js';

const router = Router();

router.get('/api/type', authRequired, getType);
router.get('/api/types', authRequired, getTypes);
router.post('/api/type', authRequired, upload.single('img'), createType);
router.put('/api/type/:id', authRequired, upload.single('img'), updateType);

export default router;