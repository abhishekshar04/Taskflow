const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  task:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:  { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  // tracks which users have read this notification
  readBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
