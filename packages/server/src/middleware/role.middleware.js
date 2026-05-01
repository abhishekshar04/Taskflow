const { error } = require('../utils/apiResponse');

// Restrict to global admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return error(res, 'Access denied. Admins only.', 403);
  }
  next();
};

// Check if user is project member or admin
const projectMember = (Project) => async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id || req.params.projectId);
    if (!project) return error(res, 'Project not found.', 404);

    const isAdmin = req.user.role === 'admin';
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (!isAdmin && !isMember && !isOwner) {
      return error(res, 'Access denied. Not a project member.', 403);
    }

    req.project = project;
    next();
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// Check if user is project owner or global admin
const projectOwner = (Project) => async (req, res, next) => {
  try {
    const project = req.project || (await Project.findById(req.params.id || req.params.projectId));
    if (!project) return error(res, 'Project not found.', 404);

    const isAdmin = req.user.role === 'admin';
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return error(res, 'Access denied. Only project owner or admin.', 403);
    }
    req.project = project;
    next();
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { adminOnly, projectMember, projectOwner };
