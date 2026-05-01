const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTasksByProject, createTask, getTaskById, updateTask,
  deleteTask, updateTaskStatus, getDashboardStats,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/project/:projectId', getTasksByProject);
router.post(
  '/project/:projectId',
  [body('title').notEmpty().withMessage('Task title required')],
  validate,
  createTask
);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch(
  '/:id/status',
  [body('status').isIn(['todo', 'in-progress', 'review', 'done']).withMessage('Invalid status')],
  validate,
  updateTaskStatus
);

const { getComments, addComment } = require('../controllers/comment.controller');

router.get('/:taskId/comments', getComments);
router.post(
  '/:taskId/comments',
  [body('text').notEmpty().withMessage('Comment text required')],
  validate,
  addComment
);

module.exports = router;
