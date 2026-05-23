import { Response } from 'express';
import Worker from '../models/Worker';
import { AuthRequest } from '../middleware/auth';

export const getWorkers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workers = await Worker.find({ managerId: req.user?.id });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addWorker = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, workType, dailyWage, photoUrl } = req.body;
    const worker = new Worker({
      managerId: req.user?.id,
      name, phone, workType, dailyWage, photoUrl
    });
    await worker.save();
    res.status(201).json(worker);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateWorker = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user?.id },
      req.body,
      { new: true }
    );
    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteWorker = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const worker = await Worker.findOneAndDelete({ _id: req.params.id, managerId: req.user?.id });
    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }
    res.json({ message: 'Worker removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
