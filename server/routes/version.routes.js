import { Router } from 'express';
import { authRequired } from '../middlewares/ValidateToken.js'
import { getVersion, getVersions, createVersion, updateVersion } from '../controllers/version.controller.js';

const router = Router();

router.get('/api/version', authRequired, getVersion);
router.get('/api/versions', authRequired, getVersions);
router.post('/api/version', authRequired, createVersion);
router.put('/api/version/:id', authRequired, updateVersion);

export default router;