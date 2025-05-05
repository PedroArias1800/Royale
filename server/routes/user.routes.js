import { Router } from 'express';
import { getUsers, getAllUsers, postUser, putUser, getUsersByRoleSeller } from '../controllers/user.controller.js';

const router = Router();

router.get('/api/users', getUsers);
router.get('/api/users/all', getAllUsers);
router.get('/api/users/sellers', getUsersByRoleSeller);
router.post('/api/user', postUser);
router.put('/api/user/:id', putUser);

export default router;