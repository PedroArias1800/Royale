import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { authRequired } from '../middlewares/validateToken.js'
import { getType, getTypeByParfumId, postGetTypes, getAllTypes, createType, getFilteredTypes, updateType, deleteType } from '../controllers/type.controller.js';

const router = Router();

router.get('/api/type', authRequired, getType);
router.get('/api/type/parfum/:parfumId', getTypeByParfumId);
router.get('/api/types/all', authRequired, getAllTypes);
router.post('/api/types', authRequired, postGetTypes);
router.post('/api/types/filtered', authRequired, getFilteredTypes);
router.post('/api/type', authRequired, upload('parfumIcon').fields([{ name: 'img' }]), createType);
router.put('/api/type/:id', authRequired, upload('parfumIcon').fields([{ name: 'img' }]), updateType);
router.post('/api/type/img', authRequired, upload('parfumsImages').fields([{ name: 'img1' }, { name: 'img2' }, { name: 'img3' }]), upload('parfumsMultiImages').fields([{ name: 'multiImages' }]), createType);
router.put('/api/type/img/:id', authRequired, upload('parfumsImages').fields([{ name: 'img1' }, { name: 'img2' }, { name: 'img3' }]), upload('parfumsMultiImages').fields([{ name: 'multiImages' }]), updateType);
router.delete('/api/type/:id', authRequired, deleteType);

export default router;