import { Router } from 'express';
import { authRequired } from '../middlewares/validateToken.js'
import { getParfum, getParfums, getAllParfums, getFilteredParfums, createParfum, updateParfum, deleteParfum } from '../controllers/parfum.controller.js';

const router = Router();

router.get('/api/parfum', authRequired, getParfum);
router.get('/api/parfums', authRequired, getParfums);
router.get('/api/parfums/all', authRequired, getAllParfums);
router.post('/api/parfums/filtered', authRequired, getFilteredParfums);
router.post('/api/parfum', authRequired, createParfum);
router.put('/api/parfum/:id', authRequired, updateParfum);
router.delete('/api/parfum/:id', authRequired, deleteParfum);

export default router;