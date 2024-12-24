import { Router } from 'express';
import { parfumVersion, allParfums, parfumsBody } from '../controllersPg/parfum.controller.pg.js';

const router = Router();

router.get('/parfum', parfumVersion);
router.get('/parfums', allParfums);
router.get('/parfums/body', parfumsBody)
// router.post('/client', createClient); 
// router.put('/client/:id', updateClient);
// router.delete('/client/:id', deleteClient);

export default router;