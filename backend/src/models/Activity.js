import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  startDate: { type: String },
  endDate: { type: String },
  scheduledDays: {
    type: [String],
    enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    default: undefined
  },
  pausePeriods: {
    type: [{
      startDate: { type: String, required: true },
      endDate: { type: String, required: true },
      reason: { type: String, default: '' }
    }],
    default: []
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
