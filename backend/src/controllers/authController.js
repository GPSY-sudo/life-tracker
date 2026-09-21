import User from '../models/User.js';
import Activity from '../models/Activity.js';
import DailyRecord from '../models/DailyRecord.js';
import Task from '../models/Task.js';
import FocusSession from '../models/FocusSession.js';
import SoundPreference from '../models/SoundPreference.js';
import AppPreference from '../models/AppPreference.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password });

    if (user) {
      res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters long');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/auth/profile
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete user account
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Delete all user-owned data from associated collections in parallel
    await Promise.all([
      Activity.deleteMany({ userId }),
      DailyRecord.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      FocusSession.deleteMany({ userId }),
      SoundPreference.deleteMany({ userId }),
      AppPreference.deleteMany({ userId }),
    ]);

    res.json({
      message: 'Account and all associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
