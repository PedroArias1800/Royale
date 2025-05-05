import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { authRequired } from '../middlewares/validateToken.js'
import { getAllTransactions, getFilteredTransactions, getExportTransactionsData, getTransactionsByUser, getCountTransactionsByUserThisMonth } from '../controllers/transaction.controller.js';

const router = Router();

router.get('/api/transaction/all', authRequired, getAllTransactions);
router.post('/api/transactions/filtered', authRequired, getFilteredTransactions);
router.get('/api/transactions/export', getExportTransactionsData);
router.get('/api/transactions/all/:id', getTransactionsByUser);
router.get('/api/transactions/monthly/:id', getCountTransactionsByUserThisMonth);


export default router;