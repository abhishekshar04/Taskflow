const User = require('../models/User');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const { success, error } = require('../utils/apiResponse');

// GET /api/users — admin only
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return success(res, { users, count: users.length });
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 'User not found.', 404);
    return success(res, { user });
  } catch (err) {
    return error(res, err.message);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, avatar, preferences } = req.body;
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return error(res, 'Not authorized to update this user.', 403);
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, avatar, preferences },
      { new: true, runValidators: true }
    );
    if (!user) return error(res, 'User not found.', 404);
    return success(res, { user }, 'User updated.');
  } catch (err) {
    return error(res, err.message);
  }
};

// DELETE /api/users/:id — admin only
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return error(res, 'User not found.', 404);
    return success(res, null, 'User deleted.');
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/users/notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const projectIds = projects.map((p) => p._id);

    const notifications = await ActivityLog.find({
      project: { $in: projectIds },
      user: { $ne: userId }, // don't show user's own actions
    })
      .populate('user', 'name avatar')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    // Attach isRead flag per notification for this user
    const result = notifications.map((n) => ({
      ...n.toObject(),
      isRead: n.readBy.some((id) => id.toString() === userId.toString()),
    }));

    return success(res, { notifications: result });
  } catch (err) {
    return error(res, err.message);
  }
};

// PATCH /api/users/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await ActivityLog.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: userId },
    });
    return success(res, null, 'Marked as read.');
  } catch (err) {
    return error(res, err.message);
  }
};

// PATCH /api/users/notifications/read-all
const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id');
    const projectIds = projects.map((p) => p._id);

    await ActivityLog.updateMany(
      { project: { $in: projectIds }, user: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    return success(res, null, 'All notifications marked as read.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getNotifications, markNotificationRead, markAllNotificationsRead };
