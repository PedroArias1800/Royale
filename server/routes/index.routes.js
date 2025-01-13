import { Router } from 'express';
import { authRequired } from '../middlewares/ValidateToken.js'
import { parfumVersion, allParfums, parfumsBody, getTransaction, createTransaction, updateTransaction } from '../controllers/index.controller.js';

const router = Router();

router.get('/parfum', parfumVersion);
router.get('/parfums', allParfums);
router.get('/parfums/body', parfumsBody)
router.get('/transaction', authRequired, getTransaction)
router.post('/transaction', createTransaction)
router.put('/transaction/:id', authRequired, updateTransaction);

export default router;