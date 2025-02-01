import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { authRequired } from '../middlewares/validateToken.js'
import { getPromotion, getPromotions, getActivePromotions, getAllPromotions, getFilteredPromotions, createPromotion, updatePromotion, deletePromotion } from '../controllers/promotion.controller.js';

const router = Router();

router.get('/api/promotion', authRequired, getPromotion);
router.get('/api/promotions', authRequired, getPromotions);
router.get('/api/promotions/all', authRequired, getAllPromotions);
router.post('/api/promotions/filtered', authRequired, getFilteredPromotions);
router.post('/api/promotion', authRequired, upload('promotion').fields([{ name: 'media' }]), createPromotion);
router.put('/api/promotion/:id', authRequired, upload('promotion').fields([{ name: 'media' }]), updatePromotion);
router.delete('/api/promotion/:id', authRequired, deletePromotion);

export default router;