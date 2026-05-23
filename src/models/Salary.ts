import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  overtimeHours: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  grossPay: { type: Number, required: true },
  advancesDeducted: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Submitted to Office', 'Paid'], default: 'Pending' },
  submissionId: { type: String },
  submittedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Salary', salarySchema);
