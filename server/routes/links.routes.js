import { Router } from 'express';
import { sendWhatsapp, sendWhatsappQA } from '../controllers/links.controller.js';

const router = Router();

router.post('/api', sendWhatsapp);
router.get('/api-true', sendWhatsappQA);

export default router;
