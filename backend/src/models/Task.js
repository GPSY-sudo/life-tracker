import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: String }, // YYYY-MM-DD
  dueTime: { type: String }, // HH:MM
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in_progress', 'completed', 'blocked'], default: 'todo' },
  reminder: { type: String },
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'monthly', 'custom'], default: 'none' },
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  tags: [{ type: String }]
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

const Task = mongoose.model('Task', taskSchema);
export default Task;
