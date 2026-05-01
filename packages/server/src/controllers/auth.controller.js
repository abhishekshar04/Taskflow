const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { success, error } = require('../utils/apiResponse');

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return error(res, 'Email already in use.', 409);

    // First ever user becomes admin automatically
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : (role || 'member');

    const user = await User.create({ name, email, password, role: assignedRole });
    const token = generateToken({ id: user._id });
    return success(res, { user, token }, 'Account created successfully.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return error(res, 'Invalid email or password.', 401);
    }
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken({ id: user._id });
    return success(res, { user, token }, 'Login successful.');
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    return success(res, { user: req.user }, 'User profile fetched.');
  } catch (err) {
    return error(res, err.message);
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      return error(res, 'Incorrect current password.', 401);
    }
    
    user.password = newPassword;
    await user.save();
    
    return success(res, {}, 'Password changed successfully.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { signup, login, getMe, changePassword };
