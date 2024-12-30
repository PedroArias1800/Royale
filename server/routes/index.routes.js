import { Router } from 'express';
import { parfumVersion, allParfums, parfumsBody } from '../controllers/index.controller.js';

const router = Router();

router.get('/parfum', parfumVersion);
router.get('/parfums', allParfums);
router.get('/parfums/body', parfumsBody)

export default router;