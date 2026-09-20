import mongoose from 'mongoose';

const appPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  pomodoro: {
    focusDuration: { type: Number, default: 25 },
    shortBreakDuration: { type: Number, default: 5 },
    longBreakDuration: { type: Number, default: 15 },
    sessionsBeforeLongBreak: { type: Number, default: 4 },
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.userId;
    }
  }
});

const AppPreference = mongoose.model('AppPreference', appPreferenceSchema);
export default AppPreference;
