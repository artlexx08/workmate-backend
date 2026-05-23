import express from 'express';
import { markAttendance, getAttendance } from '../controllers/attendanceController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.post('/', markAttendance);
router.get('/', getAttendance);

export default router;
