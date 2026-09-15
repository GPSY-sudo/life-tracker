import mongoose from 'mongoose';

const dailyRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  activities: {
    type: Map,
    of: { type: String, enum: ['partial', 'completed', 'incomplete'] },
    default: {}
  },
  diaryNote: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      
      // Convert Map to plain object for frontend compatibility
      if (ret.activities && ret.activities instanceof Map) {
        ret.activities = Object.fromEntries(ret.activities);
      }
    }
  }
});

// Ensure only one record per user per date
dailyRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyRecord = mongoose.model('DailyRecord', dailyRecordSchema);
export default DailyRecord;
