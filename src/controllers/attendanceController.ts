import { Response } from 'express';
import Attendance from '../models/Attendance';
import { AuthRequest } from '../middleware/auth';

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workerId, date, status, overtimeHours, siteId } = req.body;
    // Build query conditionally based on presence of siteId
    const queryObj: any = { workerId, date };
    if (siteId) queryObj.siteId = siteId;
    let attendance = await Attendance.findOne(queryObj);

    if (attendance) {
      if (status === 'None') {
        await Attendance.deleteOne({ _id: attendance._id });
        res.json({ workerId, date, status: 'None', overtimeHours: 0 });
        return;
      }
      attendance.status = status;
      if (overtimeHours !== undefined) {
        attendance.overtimeHours = overtimeHours;
      }
      await attendance.save();
    } else {
      if (status !== 'None') {
        attendance = new Attendance({
          workerId,
                    ...(siteId ? { siteId } : {}),
          date,
          status,
          overtimeHours: overtimeHours || 0
        });
        await attendance.save();
      }
    }
    res.json(attendance || { workerId, date, status: 'None', overtimeHours: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workerId, siteId, startDate, endDate } = req.query;
    const query: any = {};
    if (workerId) query.workerId = workerId;
    if (siteId) query.siteId = siteId;
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
