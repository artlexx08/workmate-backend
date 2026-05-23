import express from 'express';
import { getWorkers, addWorker, updateWorker, deleteWorker } from '../controllers/workerController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getWorkers);
router.post('/', addWorker);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

export default router;
