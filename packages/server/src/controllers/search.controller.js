const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

// GET /api/search?q=...
const globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return success(res, { tasks: [], projects: [], members: [] });

    const userId = req.user._id;
    const regex = new RegExp(q, 'i');

    // Projects accessible by this user
    const accessibleProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id name color description owner members');

    const projectIds = accessibleProjects.map((p) => p._id);

    // ── Tasks ─────────────────────────────────────────────────────────────
    const tasks = await Task.find({
      project: { $in: projectIds },
      $or: [
        { title: regex },
        { description: regex },
        { tags: regex },
        { status: regex },
        { priority: regex },
      ],
    })
      .populate('assignee', 'name')
      .populate('project', 'name color')
      .select('title description status priority dueDate project assignee tags')
      .limit(8);

    // ── Projects ──────────────────────────────────────────────────────────
    const projects = accessibleProjects.filter(
      (p) => regex.test(p.name) || regex.test(p.description)
    ).slice(0, 5);

    // ── Members ───────────────────────────────────────────────────────────
    // Collect unique members across accessible projects
    const memberIdSet = new Set();
    accessibleProjects.forEach((p) => {
      p.members?.forEach((m) => {
        if (m.user) memberIdSet.add(m.user.toString());
      });
    });

    const members = await User.find({
      _id: { $in: [...memberIdSet] },
      $or: [{ name: regex }, { email: regex }],
    })
      .select('name email role isActive')
      .limit(5);

    return success(res, { tasks, projects, members });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { globalSearch };
