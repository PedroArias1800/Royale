import { Router } from 'express';
import { getUsers, getAllUsers, postUser, putUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/api/users', getUsers);
router.get('/api/users/all', getAllUsers);
router.post('/api/user', postUser);
router.put('/api/user/:id', putUser);

export default router;