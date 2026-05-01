/**
 * Seed script — run with:
 *   node packages/server/src/seed.js
 *
 * Creates: 1 admin, 4 members, 3 projects, 12 tasks
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🌱 Connected to MongoDB, seeding...');

  // Clear existing data
  await Promise.all([User.deleteMany(), Project.deleteMany(), Task.deleteMany()]);
  console.log('🧹 Cleared existing data');

  // --- USERS ---
  const password = await bcrypt.hash('password123', 12);
  const users = await User.insertMany([
    { name: 'Admin User',    email: 'admin@taskflow.io',   password, role: 'admin',  isActive: true, lastActive: new Date() },
    { name: 'Alex Rivera',   email: 'alex@taskflow.io',    password, role: 'member', isActive: true, lastActive: new Date() },
    { name: 'Maya Kim',      email: 'maya@taskflow.io',    password, role: 'member', isActive: true, lastActive: new Date() },
    { name: 'Sam Chen',      email: 'sam@taskflow.io',     password, role: 'member', isActive: true, lastActive: new Date() },
    { name: 'Lena Torres',   email: 'lena@taskflow.io',    password, role: 'member', isActive: false, lastActive: new Date(Date.now() - 86400000 * 3) },
  ]);
  console.log(`👥 Created ${users.length} users`);

  const [admin, alex, maya, sam, lena] = users;

  // --- PROJECTS ---
  const projects = await Project.insertMany([
    {
      name: 'Platform Revamp',
      description: 'Full redesign and re-architecture of the core consumer platform including mobile-first UI and new API layer.',
      owner: admin._id,
      status: 'active',
      priority: 'high',
      deadline: new Date(Date.now() + 86400000 * 30),
      color: '#0058be',
      members: [
        { user: admin._id, role: 'owner' },
        { user: alex._id, role: 'member' },
        { user: maya._id, role: 'member' },
        { user: sam._id, role: 'member' },
      ],
    },
    {
      name: 'Marketing Campaign',
      description: 'Q4 global product launch campaign including social media, press releases, and influencer outreach.',
      owner: alex._id,
      status: 'active',
      priority: 'medium',
      deadline: new Date(Date.now() + 86400000 * 14),
      color: '#10b981',
      members: [
        { user: alex._id, role: 'owner' },
        { user: lena._id, role: 'member' },
        { user: admin._id, role: 'member' },
      ],
    },
    {
      name: 'Legacy Migration',
      description: 'Migrate legacy monolith services to microservices architecture with zero downtime deployments.',
      owner: maya._id,
      status: 'active',
      priority: 'high',
      deadline: new Date(Date.now() + 86400000 * 60),
      color: '#f59e0b',
      members: [
        { user: maya._id, role: 'owner' },
        { user: sam._id, role: 'member' },
        { user: admin._id, role: 'member' },
      ],
    },
  ]);
  console.log(`📁 Created ${projects.length} projects`);

  const [platform, marketing, legacy] = projects;

  // --- TASKS ---
  const now = new Date();
  const tasks = await Task.insertMany([
    // Platform Revamp
    { title: 'Design new homepage',           project: platform._id, createdBy: admin._id, assignee: alex._id,  status: 'in-progress', priority: 'high',   dueDate: new Date(now.getTime() + 86400000 * 2) },
    { title: 'Rebuild authentication flow',   project: platform._id, createdBy: admin._id, assignee: maya._id,  status: 'in-progress', priority: 'high',   dueDate: new Date(now.getTime() + 86400000 * 5) },
    { title: 'Migrate REST APIs to GraphQL',  project: platform._id, createdBy: admin._id, assignee: sam._id,   status: 'todo',        priority: 'medium', dueDate: new Date(now.getTime() + 86400000 * 10) },
    { title: 'Performance audit & profiling', project: platform._id, createdBy: admin._id, assignee: admin._id, status: 'todo',        priority: 'medium', dueDate: new Date(now.getTime() + 86400000 * 7) },
    { title: 'Deploy staging environment',    project: platform._id, createdBy: admin._id, assignee: sam._id,   status: 'done',        priority: 'high',   completedAt: new Date(now.getTime() - 86400000) },
    // Marketing Campaign
    { title: 'Draft press release copy',      project: marketing._id, createdBy: alex._id, assignee: lena._id, status: 'in-progress', priority: 'high',   dueDate: new Date(now.getTime() + 86400000 * 1) },
    { title: 'Design social media assets',    project: marketing._id, createdBy: alex._id, assignee: alex._id, status: 'todo',        priority: 'medium', dueDate: new Date(now.getTime() + 86400000 * 3) },
    { title: 'Coordinate influencer outreach',project: marketing._id, createdBy: alex._id, assignee: lena._id, status: 'done',        priority: 'low',    completedAt: new Date(now.getTime() - 86400000 * 2) },
    // Legacy Migration
    { title: 'Audit existing service dependencies', project: legacy._id, createdBy: maya._id, assignee: sam._id,  status: 'done',        priority: 'high',   completedAt: new Date(now.getTime() - 86400000 * 5) },
    { title: 'Containerize auth service',     project: legacy._id, createdBy: maya._id, assignee: maya._id, status: 'in-progress', priority: 'high',   dueDate: new Date(now.getTime() + 86400000 * 4) },
    { title: 'Set up Kubernetes cluster',     project: legacy._id, createdBy: maya._id, assignee: sam._id,  status: 'todo',        priority: 'high',   dueDate: new Date(now.getTime() + 86400000 * 20) },
    { title: 'Write migration runbooks',      project: legacy._id, createdBy: maya._id, assignee: admin._id,status: 'todo',        priority: 'medium', dueDate: new Date(now.getTime() + 86400000 * 15) },
  ]);
  console.log(`✅ Created ${tasks.length} tasks`);

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('  Admin:  admin@taskflow.io  / password123');
  console.log('  Member: alex@taskflow.io   / password123');
  console.log('  Member: maya@taskflow.io   / password123');
  console.log('  Member: sam@taskflow.io    / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
