const Task = require('../models/Task');
const Project = require('../models/Project');
const { success, error } = require('../utils/apiResponse');
const socket = require('../utils/socket');

// GET /api/tasks/project/:projectId
const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });
    return success(res, { tasks, count: tasks.length });
  } catch (err) {
    return error(res, err.message);
  }
};

// POST /api/tasks/project/:projectId
const createTask = async (req, res) => {
  try {
    const { title, description, assignee, status, priority, dueDate, tags } = req.body;
    const task = await Task.create({
      title,
      description,
      assignee,
      status,
      priority,
      dueDate,
      tags,
      project: req.params.projectId,
      createdBy: req.user._id,
    });
    await task.populate('assignee', 'name email avatar');
    try { socket.getIO().to(req.params.projectId.toString()).emit('taskCreated', task); } catch(e) { console.error('Socket error:', e.message); }
    
    await ActivityLog.create({ project: req.params.projectId, task: task._id, user: req.user._id, action: 'created task', details: { title } });

    return success(res, { task }, 'Task created.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name');
    if (!task) return error(res, 'Task not found.', 404);
    return success(res, { task });
  } catch (err) {
    return error(res, err.message);
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const { title, description, assignee, status, priority, dueDate, tags } = req.body;

    // Only the project owner may change the assignee
    const task = await Task.findById(req.params.id);
    if (!task) return error(res, 'Task not found.', 404);

    const project = await Project.findById(task.project);
    const isOwner = project && project.owner.toString() === req.user._id.toString();

    // Apply fields — use .save() so the pre('save') hook fires (sets completedAt)
    let finalStatus = status;
    if (finalStatus === 'done' && !isOwner) finalStatus = 'review';

    if (title    !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (finalStatus   !== undefined) task.status      = finalStatus;
    if (priority !== undefined) task.priority    = priority;
    if (dueDate  !== undefined) task.dueDate     = dueDate || null;
    if (tags     !== undefined) task.tags        = tags;
    if (isOwner  && assignee !== undefined) task.assignee = assignee || null;

    // Clear completedAt if moved away from done
    if (finalStatus && finalStatus !== 'done') task.completedAt = undefined;

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    try { socket.getIO().to(task.project.toString()).emit('taskUpdated', task); } catch(e) { console.error('Socket error:', e.message); }

    await ActivityLog.create({ project: task.project, task: task._id, user: req.user._id, action: 'updated task', details: { title: task.title } });

    return success(res, { task }, 'Task updated.');
  } catch (err) {
    return error(res, err.message);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return error(res, 'Task not found.', 404);
    
    try { socket.getIO().to(task.project.toString()).emit('taskDeleted', req.params.id); } catch(e) { console.error('Socket error:', e.message); }
    
    await ActivityLog.create({ project: task.project, user: req.user._id, action: 'deleted task', details: { title: task.title } });

    return success(res, null, 'Task deleted.');
  } catch (err) {
    return error(res, err.message);
  }
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  try {
    let { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return error(res, 'Task not found.', 404);

    const project = await Project.findById(task.project);
    const isOwner = project && project.owner.toString() === req.user._id.toString();

    if (status === 'done' && !isOwner) {
      status = 'review';
    }

    task.status = status;
    if (status === 'done') {
      task.completedAt = new Date();
    } else {
      task.completedAt = undefined;
    }
    await task.save();

    try { socket.getIO().to(task.project.toString()).emit('taskUpdated', task); } catch(e) { console.error('Socket error:', e.message); }

    await ActivityLog.create({ project: task.project, task: task._id, user: req.user._id, action: `moved task to ${status}`, details: { title: task.title } });

    return success(res, { task }, 'Status updated.');
  } catch (err) {
    return error(res, err.message);
  }
};

const ActivityLog = require('../models/ActivityLog');

// GET /api/tasks/dashboard — aggregated stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get projects user is part of
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('name');

    const projectIds = projects.map((p) => p._id);

    const [total, inProgress, overdue, doneToday] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({
        project: { $in: projectIds },
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() },
      }),
      Task.countDocuments({
        project: { $in: projectIds },
        status: 'done',
        completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);

    const completedTasksLast7Days = await Task.aggregate([
      { $match: { project: { $in: projectIds }, status: 'done', completedAt: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 }
      }}
    ]);

    const trend = [];
    for(let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = completedTasksLast7Days.find(t => t._id === dateStr);
      trend.push(found ? found.count : 0);
    }
    const maxTrend = Math.max(...trend, 1);
    const trendData = trend.map(count => Math.round((count / maxTrend) * 100));

    const myTasks = await Task.find({
      project: { $in: projectIds },
      assignee: userId,
      status: { $in: ['todo', 'in-progress', 'review'] },
    })
      .populate('assignee', 'name avatar')
      .populate('project', 'name')
      .sort({ dueDate: 1 })
      .limit(10);

    const projectHealth = await Promise.all(projects.map(async p => {
      const totalTasks = await Task.countDocuments({ project: p._id });
      const doneTasks = await Task.countDocuments({ project: p._id, status: 'done' });
      return {
        _id: p._id,
        name: p.name,
        pct: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
      };
    }));

    const recentActivity = await ActivityLog.find({ project: { $in: projectIds } })
      .populate('user', 'name avatar')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    return success(res, {
      stats: { total, inProgress, overdue, doneToday },
      myTasks,
      projectHealth,
      recentActivity,
      trendData,
      projectCount: projectIds.length,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getTasksByProject, createTask, getTaskById, updateTask, deleteTask, updateTaskStatus, getDashboardStats };

