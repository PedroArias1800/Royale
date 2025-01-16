import { Router } from 'express';
import { logIn, logOut, verifyToken, profile } from '../controllers/auth.controller.js';
import { authRequired } from '../middlewares/validateToken.js'

const router = Router();

router.post('/api/login', logIn);
router.post('/api/logout', logOut);
router.get('/api/verify', verifyToken);
router.get('/api/profile', authRequired, profile);


export default router;
