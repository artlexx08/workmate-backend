import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  location: { type: String },
  clientName: { type: String },
  startDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model('Site', siteSchema);
