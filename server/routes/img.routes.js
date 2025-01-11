import { Router } from 'express';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getParfumsGallery, getParfumsIconGallery } from '../controllers/img.controller.js';

const router = Router();

router.get('/api/img', authRequired, getParfumsGallery);
router.get('/api/img/icon', authRequired, getParfumsIconGallery);

export default router;