import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // minutes
  type: { type: String, enum: ['focus', 'shortBreak', 'longBreak'], required: true },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
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

const FocusSession = mongoose.model('FocusSession', focusSessionSchema);
export default FocusSession;
