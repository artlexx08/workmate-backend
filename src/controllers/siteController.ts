import { Response } from 'express';
import Site from '../models/Site';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
// Create a new site
export const createSite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, location, clientName, startDate, status } = req.body;
    const site = new Site({
      managerId: req.user?.id,
      name,
      location,
      clientName,
      startDate,
      status,
    });
    await site.save();
    res.status(201).json(site);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all sites for current manager
export const getSites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sites = await Site.find({ managerId: req.user?.id }).sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a site
export const updateSite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const site = await Site.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user?.id },
      req.body,
      { new: true }
    );
    if (!site) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a site (only when no workers attached)
export const deleteSite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const Worker = (await import('../models/Worker')).default;
    const siteId = new mongoose.Types.ObjectId(req.params.id as string);

    const workers = await Worker.find({
      siteIds: siteId
    });

    if (workers.length > 0) {
      res.status(400).json({ message: 'Site has workers; cannot delete' });
      return;
    }
    await Site.findByIdAndDelete(req.params.id);
    res.json({ message: 'Site deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
