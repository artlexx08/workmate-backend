import { Response } from 'express';
import Salary from '../models/Salary';
import Advance from '../models/Advance';
import Worker from '../models/Worker';
import Attendance from '../models/Attendance';
import { AuthRequest } from '../middleware/auth';

export const addAdvance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workerId, amount, reason, date } = req.body;
    const advance = new Advance({ workerId, amount, reason, date });
    await advance.save();
    res.status(201).json(advance);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdvances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workerId } = req.query;
    const query: any = { deducted: false };
    if (workerId) query.workerId = workerId;
    const advances = await Advance.find(query).sort({ date: -1 });
    res.json(advances);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const calculateSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workerId, startDate, endDate } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    // Get attendance
    const attendanceRecords = await Attendance.find({
      workerId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    let totalDays = 0;
    let overtimeHours = 0;
    attendanceRecords.forEach(record => {
      if (record.status === 'Present') totalDays += 1;
      if (record.status === 'Half Day') totalDays += 0.5;
      overtimeHours += (record as any).overtimeHours || 0;
    });

    // Overtime hourly rate: if overtimeRate is not set, default to 1.5 * (dailyWage / 8)
    const overtimeRate = (worker as any).overtimeRate && (worker as any).overtimeRate > 0
      ? (worker as any).overtimeRate
      : Math.round((worker.dailyWage / 8) * 1.5);

    const overtimePay = overtimeHours * overtimeRate;
    const grossPay = (totalDays * worker.dailyWage) + overtimePay;

    // Get undeducted advances
    const advances = await Advance.find({ workerId, deducted: false });
    const advancesDeducted = advances.reduce((sum, adv) => sum + adv.amount, 0);

    const netPay = grossPay - advancesDeducted;

    const salary = new Salary({
      workerId,
      startDate,
      endDate,
      totalDays,
      overtimeHours,
      overtimePay,
      grossPay,
      advancesDeducted,
      netPay,
      status: 'Pending'
    });

    await salary.save();

    // Mark advances as deducted
    for (let adv of advances) {
      adv.deducted = true;
      await adv.save();
    }

    res.status(201).json(salary);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSalaries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workerId } = req.query;
    const query: any = {};
    if (workerId) query.workerId = workerId;
    const salaries = await Salary.find(query).sort({ createdAt: -1 }).populate('workerId', 'name');
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) {
      res.status(404).json({ message: 'Salary slip not found' });
      return;
    }
    res.json({ message: 'Salary slip deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAdvance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const advance = await Advance.findByIdAndDelete(req.params.id);
    if (!advance) {
      res.status(404).json({ message: 'Advance record not found' });
      return;
    }
    res.json({ message: 'Advance record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitSalaries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { salaryIds } = req.body;
    if (!salaryIds || !Array.isArray(salaryIds)) {
      res.status(400).json({ message: 'Invalid salaryIds list' });
      return;
    }
    const submissionId = `SUB-${Date.now()}`;
    await Salary.updateMany(
      { _id: { $in: salaryIds } },
      { status: 'Submitted to Office', submissionId, submittedAt: new Date() }
    );
    res.json({ message: 'Salaries submitted successfully', submissionId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const paySalaries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { salaryIds } = req.body;
    if (!salaryIds || !Array.isArray(salaryIds)) {
      res.status(400).json({ message: 'Invalid salaryIds list' });
      return;
    }
    await Salary.updateMany(
      { _id: { $in: salaryIds } },
      { status: 'Paid' }
    );
    res.json({ message: 'Salaries marked as Paid' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const managerId = req.user?.id;
    const workers = await Worker.find({ managerId });
    const workerIds = workers.map(w => w._id);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const attendanceToday = await Attendance.find({
      workerId: { $in: workerIds },
      date: { $gte: startOfToday, $lte: endOfToday }
    });
    const presentToday = attendanceToday.filter(r => r.status === 'Present' || r.status === 'Half Day').length;

    // Advances - sum all undeducted
    const advances = await Advance.find({ workerId: { $in: workerIds }, deducted: false });
    const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

    // Weekly total salary (slips generated in last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weeklySalaries = await Salary.find({
      workerId: { $in: workerIds },
      createdAt: { $gte: lastWeek }
    });
    const totalSalaryThisWeek = weeklySalaries.reduce((sum, s) => sum + s.netPay, 0);

    // Submission states
    const allSalaries = await Salary.find({ workerId: { $in: workerIds } });
    const officeSubmissionAmount = allSalaries
      .filter(s => s.status === 'Submitted to Office')
      .reduce((sum, s) => sum + s.netPay, 0);

    const pendingPayments = allSalaries
      .filter(s => s.status === 'Pending' || s.status === 'Submitted to Office')
      .reduce((sum, s) => sum + s.netPay, 0);

    const salariesPending = allSalaries
      .filter(s => s.status === 'Pending')
      .reduce((sum, s) => sum + s.netPay, 0);

    // Monthly stats (current calendar month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlySalaries = await Salary.find({
      workerId: { $in: workerIds },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalSalaryThisMonth = monthlySalaries.reduce((sum, s) => sum + s.netPay, 0);
    const submittedToOfficeThisMonth = monthlySalaries
      .filter(s => s.status === 'Submitted to Office')
      .reduce((sum, s) => sum + s.netPay, 0);
    const remainingUnpaidThisMonth = monthlySalaries
      .filter(s => s.status === 'Pending' || s.status === 'Submitted to Office')
      .reduce((sum, s) => sum + s.netPay, 0);
    const paidAmountThisMonth = monthlySalaries
      .filter(s => s.status === 'Paid')
      .reduce((sum, s) => sum + s.netPay, 0);

    const monthlyAdvancesList = await Advance.find({
      workerId: { $in: workerIds },
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const advancePaymentsTotalThisMonth = monthlyAdvancesList.reduce((sum, a) => sum + a.amount, 0);

    const paidCount = monthlySalaries.filter(s => s.status === 'Paid').length;
    const unpaidCount = monthlySalaries.filter(s => s.status !== 'Paid').length;

    res.json({
      totalWorkers: workers.length,
      presentToday,
      totalAdvances,
      totalSalaryThisWeek,
      officeSubmissionAmount,
      pendingPayments,
      salariesPending,
      totalSalaryThisMonth,
      submittedToOfficeThisMonth,
      remainingUnpaidThisMonth,
      advancePaymentsTotalThisMonth,
      paidAmountThisMonth,
      paidCount,
      unpaidCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
