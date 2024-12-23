import { Router } from 'express';
import { sendWhatsapp, sendWhatsappQA } from '../controllers/links.controller.js';

const router = Router();

router.post('/api', sendWhatsapp);

export default router;
