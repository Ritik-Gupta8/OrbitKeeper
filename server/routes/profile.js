import express from 'express';
import { get, update } from '../controllers/profileController.js';

const router = express.Router();

router.get('/', get);
router.put('/', update);

export default router;
