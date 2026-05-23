import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  siteIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }],
  name: { type: String, required: true },
  phone: { type: String },
  workType: { type: String, required: true }, // e.g., 'Carpenter', 'Helper'
  photoUrl: { type: String },
  dailyWage: { type: Number, required: true },
  overtimeRate: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Worker', workerSchema);
