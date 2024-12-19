import { Router } from 'express';
import { clientId, clients, createClient, updateClient, deleteClient } from '../controllers/cliente.controller.js';

const router = Router();

router.get('/client/:id', clientId);
router.get('/client', clients);
router.post('/client', createClient); 
router.put('/client/:id', updateClient);
router.delete('/client/:id', deleteClient);

export default router;