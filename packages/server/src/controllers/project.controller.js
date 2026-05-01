const Project = require('../models/Project');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const ActivityLog = require('../models/ActivityLog');

// GET /api/projects — projects where user is member or owner
const getProjects = async (req, res) => {
  try {
    const query =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] };

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    return success(res, { projects, count: projects.length });
  } catch (err) {
    return error(res, err.message);
  }
};

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description, deadline, priority, color } = req.body;
    const project = await Project.create({
      name,
      description,
      deadline,
      priority,
      color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });
    await project.populate('owner', 'name email avatar');

    await ActivityLog.create({ project: project._id, user: req.user._id, action: 'created project' });

    return success(res, { project }, 'Project created.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    if (!project) return error(res, 'Project not found.', 404);
    return success(res, { project });
  } catch (err) {
    return error(res, err.message);
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const { name, description, status, deadline, priority, color } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, deadline, priority, color },
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatar').populate('members.user', 'name email avatar');
    if (!project) return error(res, 'Project not found.', 404);

    await ActivityLog.create({ project: project._id, user: req.user._id, action: 'updated project details' });

    return success(res, { project }, 'Project updated.');
  } catch (err) {
    return error(res, err.message);
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return error(res, 'Project not found.', 404);
    return success(res, null, 'Project deleted.');
  } catch (err) {
    return error(res, err.message);
  }
};

// POST /api/projects/:id/members
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return error(res, 'Project not found.', 404);

    const user = await User.findById(userId);
    if (!user) return error(res, 'User not found.', 404);

    const alreadyMember = project.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) return error(res, 'User is already a member.', 409);

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    await ActivityLog.create({ project: project._id, user: req.user._id, action: `added user ${user.name} to project` });

    return success(res, { project }, 'Member added.');
  } catch (err) {
    return error(res, err.message);
  }
};

// DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return error(res, 'Project not found.', 404);

    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await project.save();

    await ActivityLog.create({ project: project._id, user: req.user._id, action: 'removed a member from project' });

    return success(res, null, 'Member removed.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getProjects, createProject, getProjectById, updateProject, deleteProject, addMember, removeMember };
