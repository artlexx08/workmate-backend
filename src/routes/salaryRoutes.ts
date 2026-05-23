import express from 'express';
import { 
  addAdvance, 
  getAdvances, 
  calculateSalary, 
  getSalaries, 
  deleteSalary, 
  deleteAdvance,
  submitSalaries,
  paySalaries,
  getDashboardStats
} from '../controllers/salaryController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.post('/advance', addAdvance);
router.get('/advance', getAdvances);
router.delete('/advance/:id', deleteAdvance);
router.post('/calculate', calculateSalary);
router.put('/submit', submitSalaries);
router.put('/pay', paySalaries);
router.get('/dashboard-stats', getDashboardStats);
router.get('/', getSalaries);
router.delete('/:id', deleteSalary);

export default router;
