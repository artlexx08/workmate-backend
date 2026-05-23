import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: false, default: null },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Half Day'], required: true },
  overtimeHours: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure a worker can only have one attendance record per day
attendanceSchema.index({ workerId: 1, date: 1, siteId: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
