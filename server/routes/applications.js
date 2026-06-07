import express from 'express';
import { getAll, getOne, create, update, remove, stats } from '../controllers/applicationController.js';

const router = express.Router();

router.get('/stats', stats);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
