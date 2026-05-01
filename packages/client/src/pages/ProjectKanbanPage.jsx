import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import socket from '../api/socket';
import api from '../api/axios';
import TaskDetailsModal from '../components/TaskDetailsModal';

const priorityBadge = { low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-50 text-amber-600', high: 'bg-red-50 text-red-600' };
const cols = ['todo', 'in-progress', 'review', 'done'];
const colMeta = {
  'todo': { label: 'To Do', dot: 'bg-slate-400', countBg: 'bg-surface-container-high text-on-surface-variant' },
  'in-progress': { label: 'In Progress', dot: 'bg-blue-500', countBg: 'bg-blue-100 text-blue-700' },
  'review': { label: 'Review', dot: 'bg-amber-500', countBg: 'bg-amber-100 text-amber-700' },
  'done': { label: 'Done', dot: 'bg-emerald-500', countBg: 'bg-emerald-100 text-emerald-700' },
};

export default function ProjectKanbanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, fetchProject } = useProjectStore();
  const { tasks, fetchTasks, createTask, updateTaskStatus, updateTask, deleteTask, handleTaskCreated, handleTaskUpdated, handleTaskDeleted, loading } = useTaskStore();
  const { user: currentUser } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', status: 'todo', assignee: '' });
  const [creating, setCreating] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // True when the logged-in user is the project owner
  const isOwner = currentProject?.owner?._id === currentUser?._id ||
                  currentProject?.owner === currentUser?._id;

  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => { 
    fetchProject(id); 
    fetchTasks(id); 
    
    socket.connect();
    socket.emit('joinProject', id);
    
    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);
    
    return () => {
      socket.emit('leaveProject', id);
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
    };
  }, [id, handleTaskCreated, handleTaskUpdated, handleTaskDeleted]);

  const tasksByCol = (col) => tasks.filter((t) => t.status === col);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createTask(id, form);
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'medium', dueDate: '', status: 'todo', assignee: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    } finally { setCreating(false); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAddingMember(true);
    try {
      await api.post(`/projects/${id}/members`, { userId: selectedUser, role: 'member' });
      await fetchProject(id);
      setShowAddMember(false);
      setSelectedUser('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const loadUsersForAdd = async () => {
    try {
      const res = await api.get('/users');
      setAllUsers(res.data.data.users);
      setShowAddMember(true);
    } catch (err) {
      alert('Failed to load users');
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <button onClick={() => navigate('/projects')} className="hover:text-slate-700">Projects</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-900 font-medium">{currentProject?.name || '...'}</span>
          </div>
          <h2 className="text-3xl font-semibold text-primary">Board View</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-4 items-center cursor-pointer">
            {currentProject?.members?.slice(0, 4).map((m, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-white text-xs font-bold relative z-10">
                {m.user?.name?.charAt(0) || '?'}
              </div>
            ))}
            <div onClick={loadUsersForAdd} className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:text-secondary hover:border-secondary flex items-center justify-center relative z-0 transition-colors" title="Add Member">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            <span className="material-symbols-outlined">add</span> New Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {cols.map((col) => {
          const meta = colMeta[col];
          const colTasks = tasksByCol(col);
          return (
            <div key={col} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-2">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">{meta.label}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${meta.countBg}`}>{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {colTasks.map((task) => (
                  <div key={task._id} onClick={() => setSelectedTask(task)} className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer ${col === 'in-progress' ? 'border-blue-200' : col === 'review' ? 'border-amber-200' : 'border-slate-200'} ${col === 'done' ? 'opacity-75' : ''}`}>
                    {col === 'in-progress' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                    {col === 'review' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${priorityBadge[task.priority]}`}>{task.priority} priority</span>
                      <div className="flex items-center gap-1">
                        {col === 'done' && <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>}
                        <button onClick={(e) => { e.stopPropagation(); window.confirm('Delete this task?') && deleteTask(task._id); }} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete Task">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <h4 className={`text-sm font-semibold mb-1 ${col === 'done' ? 'line-through text-slate-500' : 'text-slate-900'}`}>{task.title}</h4>
                    {task.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center justify-between mt-2">
                      {isOwner ? (
                        <select
                          value={task.assignee?._id || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateTask(task._id, { assignee: e.target.value })}
                          className="text-[11px] bg-transparent border-none text-slate-600 outline-none cursor-pointer w-[100px] truncate p-0"
                        >
                          <option value="">Unassigned</option>
                          {currentProject?.members?.map(m => (
                            <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[11px] text-slate-500 truncate w-[100px]">
                          {task.assignee?.name || 'Unassigned'}
                        </span>
                      )}
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                        className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none cursor-pointer"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        {(isOwner || task.status === 'done') && <option value="done">Done</option>}
                      </select>
                    </div>
                  </div>
                ))}
                <button onClick={() => { setForm(f => ({...f, status: col})); setShowModal(true); }}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 flex items-center justify-center gap-2 hover:border-slate-300 hover:text-slate-500 transition-all">
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span className="text-xs font-bold uppercase tracking-wider">New Task</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-2xl font-semibold text-primary">New Task</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-lg">
              <div>
                <label className="text-sm font-semibold block mb-xs">Task Title *</label>
                <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required placeholder="e.g. Update API docs"
                  className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-xs">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3}
                  className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm outline-none focus:border-secondary resize-none" placeholder="Task details..." />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="text-sm font-semibold block mb-xs">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm bg-white outline-none">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-xs">Status</label>
                  <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm bg-white outline-none">
                    <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="review">Review</option>
                    {isOwner && <option value="done">Done</option>}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="text-sm font-semibold block mb-xs">Assign To</label>
                  <select value={form.assignee} onChange={(e) => setForm({...form, assignee: e.target.value})} className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm bg-white outline-none">
                    <option value="">Unassigned</option>
                    {currentProject?.members?.map(m => (
                      <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-xs">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm outline-none focus:border-secondary" />
                </div>
              </div>
              <div className="flex gap-md pt-md">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">{creating ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button onClick={() => setShowModal(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-xl font-semibold text-primary">Add Member</h3>
              <button onClick={() => setShowAddMember(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-md">
              <div>
                <label className="text-sm font-semibold block mb-xs">Select User</label>
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm bg-white outline-none">
                  <option value="" disabled>Choose a user...</option>
                  {allUsers.filter(u => !currentProject?.members?.find(m => m.user?._id === u._id)).map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-md pt-md">
                <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={addingMember || !selectedUser} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">{addingMember ? 'Adding...' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={tasks.find(t => t._id === selectedTask._id) || selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          currentProject={currentProject}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
