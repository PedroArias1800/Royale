import { Router } from 'express';
import { postUser, logIn, logOut, profile } from '../controllers/auth.controller.js';
import { authRequired } from '../middlewares/ValidateToken.js'

const router = Router();

router.post('/api/user', postUser);
router.post('/api/login', logIn);
router.post('/api/logout', logOut);
router.get('/api/profile', authRequired, profile);


export default router;
