import { Router } from 'express';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getVersion, getVersions, getAllVersions, createVersion, updateVersion, deleteVersion } from '../controllers/version.controller.js';

const router = Router();

router.get('/api/version', authRequired, getVersion);
router.get('/api/versions', authRequired, getVersions);
router.get('/api/versions/all', authRequired, getAllVersions);
router.post('/api/version', authRequired, createVersion);
router.put('/api/version/:id', authRequired, updateVersion);
router.delete('/api/version/:id', authRequired, deleteVersion);

export default router;