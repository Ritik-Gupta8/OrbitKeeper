import express from 'express';
import { getLogs } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getLogs);

export default router;
