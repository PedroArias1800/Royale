import { Router } from 'express';
import { sendWhatsapp } from '../controllers/links.controller.js';

const router = Router();

router.post('/api', sendWhatsapp);

export default router;
