import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getAllTransactions, getFilteredTransactions } from '../controllers/transaction.controller.js';

const router = Router();

router.get('/api/transaction/all', authRequired, getAllTransactions);
router.post('/api/transactions/filtered', authRequired, getFilteredTransactions);


export default router;