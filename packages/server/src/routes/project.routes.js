const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProjects, createProject, getProjectById, updateProject,
  deleteProject, addMember, removeMember,
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');
const { projectOwner } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const Project = require('../models/Project');

router.use(protect);

router.get('/', getProjects);
router.post(
  '/',
  [body('name').notEmpty().withMessage('Project name required')],
  validate,
  createProject
);
router.get('/:id', getProjectById);
router.put('/:id', projectOwner(Project), updateProject);
router.delete('/:id', projectOwner(Project), deleteProject);
router.post('/:id/members', projectOwner(Project), addMember);
router.delete('/:id/members/:userId', projectOwner(Project), removeMember);

module.exports = router;
