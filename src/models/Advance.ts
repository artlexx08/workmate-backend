import mongoose from 'mongoose';

const advanceSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  amount: { type: Number, required: true },
  reason: { type: String },
  date: { type: Date, default: Date.now },
  deducted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Advance', advanceSchema);
