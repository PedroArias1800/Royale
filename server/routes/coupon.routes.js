import { Router } from 'express';
import { authRequired } from '../middlewares/validateToken.js'
import { getCoupon, getCoupons, getAllCoupons, getFilteredCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/coupon.controller.js';

const router = Router();

router.get('/api/coupon', authRequired, getCoupon);
router.get('/api/coupons', authRequired, getCoupons);
router.get('/api/coupons/all', authRequired, getAllCoupons);
router.post('/api/coupons/filtered', authRequired, getFilteredCoupons);
router.post('/api/coupon', authRequired, createCoupon);
router.put('/api/coupon/:id', authRequired, updateCoupon);
router.delete('/api/coupon/:id', authRequired, deleteCoupon);

export default router;
