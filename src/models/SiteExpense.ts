import mongoose from 'mongoose';

const siteExpenseSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  category: {
    type: String,
    enum: ['Wood/Material', 'Transport', 'Food', 'Equipment', 'Miscellaneous'],
    required: true,
  },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('SiteExpense', siteExpenseSchema);
