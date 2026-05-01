const Comment = require('../models/Comment');
const Task = require('../models/Task');

// @desc    Get comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private
exports.getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { comments } });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      text
    });

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name email role');

    res.status(201).json({ success: true, data: { comment: populatedComment } });
  } catch (err) {
    next(err);
  }
};
