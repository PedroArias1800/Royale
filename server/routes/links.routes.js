import { Router } from 'express';
import { sendWhatsappQA } from '../controllers/links.controller.js';

const router = Router();

// router.post('/send', sendEmail);
// router.post('/api', sendWhatsapp);
router.get('/api-true', sendWhatsappQA);

export default router;
