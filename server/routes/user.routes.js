import { Router } from 'express';
import { getUsers, postUser, putUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/api/users', getUsers);
router.post('/api/user', postUser);
router.put('/api/user', putUser);

export default router;