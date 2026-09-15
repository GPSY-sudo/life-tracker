import Task from '../models/Task.js';
import { toISODate } from '../utils/dateUtils.js';

// @desc    Get all tasks
// @route   GET /api/tasks
export const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const {
      title, description, dueDate, dueTime, priority, status, reminder, recurrence, activityId, tags
    } = req.body;
    
    const task = new Task({
      userId: req.user._id,
      title,
      description,
      dueDate: dueDate ? toISODate(dueDate) : undefined,
      dueTime,
      priority,
      status,
      reminder,
      recurrence,
      activityId,
      tags
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const {
      title,
      description,
      dueDate,
      dueTime,
      priority,
      status,
      reminder,
      recurrence,
      activityId,
      tags
    } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = toISODate(dueDate);
    if (dueTime !== undefined) task.dueTime = dueTime;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (reminder !== undefined) task.reminder = reminder;
    if (recurrence !== undefined) task.recurrence = recurrence;
    if (activityId !== undefined) task.activityId = activityId;
    if (tags !== undefined) task.tags = tags;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};
// @desc    Delete a task
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    next(error);
  }
};
