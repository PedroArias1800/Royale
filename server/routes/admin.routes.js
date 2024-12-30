import { Router } from 'express';
import { postBrand } from '../controllers/admin.controller.js';

const router = Router();

router.post('/admin/brand', postBrand);

export default router;
