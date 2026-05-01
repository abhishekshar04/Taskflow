import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import TaskDetailsModal from '../components/TaskDetailsModal';
import api from '../api/axios';

export default function DashboardPage() {
  const { dashboardStats, fetchDashboard, loading, updateTask, updateTaskStatus } = useTaskStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask]       = useState(null);
  const [selectedProject, setSelectedProject] = useState(null); // full project for modal
  const [markingDone, setMarkingDone]         = useState(null);  // task id being marked

  useEffect(() => { fetchDashboard(); }, []);

  const stats          = dashboardStats?.stats        || {};
  const myTasks        = dashboardStats?.myTasks || [];
  const projectHealth  = dashboardStats?.projectHealth || [];
  const recentActivity = dashboardStats?.recentActivity || [];

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Fetch full project (with members) when opening modal
  const openTask = useCallback(async (task) => {
    setSelectedTask(task);
    if (task.project?._id || task.project) {
      try {
        const res = await api.get(`/projects/${task.project?._id || task.project}`);
        setSelectedProject(res.data.data.project);
      } catch { setSelectedProject(null); }
    }
  }, []);

  const handleMarkDone = async (e, taskId) => {
    e.stopPropagation();
    setMarkingDone(taskId);
    try {
      await updateTaskStatus(taskId, 'done');
      await fetchDashboard();
    } finally {
      setMarkingDone(null);
    }
  };

  const statusBadge = (status) => ({
    'todo':        'bg-slate-100    text-slate-700',
    'in-progress': 'bg-blue-100    text-blue-700',
    'review':      'bg-amber-100   text-amber-700',
    'done':        'bg-emerald-100  text-emerald-700',
  }[status] || 'bg-slate-100 text-slate-700');

  const statusLabel = (s) => ({ 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' }[s] || s);

  const isOverdue = (task) =>
    task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));

  return (
    <div>
      {/* Welcome */}
      <section className="mb-8">
        <h2 className="text-4xl font-bold text-primary mb-1 tracking-tight">
          {greeting}, {user?.name?.split(' ')[0]}.
        </h2>
        <p className="text-on-primary-container">Here's what's happening with your projects today.</p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-gutter mb-xl">
        {[
          { label: 'Total Tasks',  value: stats.total      ?? '—', icon: 'task_alt',     color: 'text-secondary',           bg: 'bg-secondary-fixed/30',   badge: `${stats.inProgress ?? 0} in progress`, badgeColor: 'text-on-surface-variant' },
          { label: 'In Progress',  value: stats.inProgress ?? '—', icon: 'pending',       color: 'text-secondary-container',  bg: 'bg-secondary-fixed/50',   badge: 'Active now',          badgeColor: 'text-secondary-container' },
          { label: 'Overdue',      value: stats.overdue    ?? '—', icon: 'error_outline', color: 'text-error',                bg: 'bg-error-container/50',   badge: 'Action required',     badgeColor: 'text-error' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest border border-slate-200 p-lg rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-md">
              <span className={`material-symbols-outlined ${s.color} ${s.bg} p-2 rounded-lg`}>{s.icon}</span>
              <span className={`text-xs font-bold ${s.badgeColor}`}>{s.badge}</span>
            </div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-xs">{s.label}</p>
            <h3 className="text-3xl font-bold text-primary">{loading ? '...' : s.value}</h3>
          </div>
        ))}

        {/* Daily goal card */}
        <div className="bg-primary-container text-white p-lg rounded-xl shadow-lg relative overflow-hidden hidden lg:block">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-xs">Today's Progress</p>
              <h3 className="text-2xl font-semibold">
                {stats.total ? Math.round(((stats.doneToday || 0) / (stats.total || 1)) * 100) : 0}% Complete
              </h3>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full mt-4">
              <div className="bg-secondary-fixed h-full rounded-full transition-all" style={{ width: `${stats.total ? Math.round(((stats.doneToday || 0) / (stats.total || 1)) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[120px]">rocket_launch</span>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

        {/* My Tasks */}
        <section className="lg:col-span-8 space-y-md">
          <div className="flex items-center justify-between mb-sm">
            <div>
              <h3 className="text-2xl font-semibold text-primary">My Tasks</h3>
              {myTasks.length > 0 && (
                <p className="text-xs text-on-surface-variant mt-0.5">{myTasks.length} active task{myTasks.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="text-secondary text-sm font-semibold hover:underline flex items-center gap-1"
            >
              View All
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white border border-slate-200 p-md rounded-lg animate-pulse flex items-center gap-4">
                  <div className="w-6 h-6 rounded bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-2 bg-slate-100 rounded w-1/3" />
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : myTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 p-xl rounded-xl text-center">
              <span className="material-symbols-outlined text-5xl mb-3 block text-emerald-300">task_alt</span>
              <p className="text-base font-semibold text-slate-700 mb-1">All caught up! 🎉</p>
              <p className="text-sm text-slate-400">No active tasks assigned to you right now.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {myTasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <div
                    key={task._id}
                    onClick={() => openTask(task)}
                    className={`bg-white border rounded-xl p-md flex items-center justify-between group hover:shadow-md transition-all cursor-pointer ${
                      overdue ? 'border-red-200 hover:border-red-400' : 'border-slate-200 hover:border-secondary'
                    }`}
                  >
                    {/* Left: checkbox + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Quick-done button */}
                      <button
                        onClick={(e) => handleMarkDone(e, task._id)}
                        disabled={markingDone === task._id || task.status === 'review'}
                        title={task.status === 'review' ? "Pending Review" : "Mark as done"}
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                          ${markingDone === task._id
                            ? 'border-emerald-400 bg-emerald-50'
                            : task.status === 'review'
                            ? 'border-amber-400 bg-amber-50 text-amber-500 cursor-not-allowed'
                            : 'border-slate-300 group-hover:border-emerald-400 hover:bg-emerald-50'}`}
                      >
                        {markingDone === task._id
                          ? <span className="material-symbols-outlined text-emerald-500 text-[13px] animate-spin">progress_activity</span>
                          : task.status === 'review'
                          ? <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
                          : <span className="material-symbols-outlined text-emerald-400 text-[13px] opacity-0 group-hover:opacity-100">check</span>
                        }
                      </button>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-primary truncate">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {task.project?.name && (
                            <span className="text-[11px] text-slate-400 font-medium">{task.project.name}</span>
                          )}
                          {task.dueDate && (
                            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${overdue ? 'text-red-500' : 'text-slate-500'}`}>
                              <span className="material-symbols-outlined text-[12px]">{overdue ? 'schedule' : 'event'}</span>
                              {overdue ? 'Overdue · ' : ''}{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {task.assignee?.name && (
                            <span className="text-[11px] text-slate-400">→ {task.assignee.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: status badge */}
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ml-3 ${statusBadge(task.status)}`}>
                      {statusLabel(task.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sprint Banner */}
          {projectHealth.length > 0 && (
            <div className="mt-lg relative rounded-xl overflow-hidden h-[200px] bg-primary">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent p-xl flex flex-col justify-end">
                <h4 className="text-white text-2xl font-semibold mb-2">{projectHealth[0]?.name} Progress</h4>
                <p className="text-white/70 text-sm max-w-md">
                  This project is currently {projectHealth[0]?.pct}% completed based on task status.
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => navigate(`/projects/${projectHealth[0]?._id}`)}
                    className="bg-white/10 text-white border border-white/20 backdrop-blur px-6 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    Go to Board
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar widgets */}
        <aside className="lg:col-span-4 space-y-gutter">
          {/* Project Health */}
          <div className="bg-surface-container-lowest border border-slate-200 p-lg rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-lg">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Project Health</h4>
              <span className="material-symbols-outlined text-slate-400">more_horiz</span>
            </div>
            <div className="space-y-md">
              {projectHealth.length === 0 ? (
                <div className="text-xs text-slate-400">No active projects</div>
              ) : projectHealth.map((p, i) => {
                const color     = ['bg-secondary', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'][i % 4];
                const textColor = ['text-secondary', 'text-emerald-600', 'text-violet-600', 'text-amber-600'][i % 4];
                return (
                  <div key={p._id}>
                    <div className="flex justify-between mb-xs">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className={`text-sm font-bold ${textColor}`}>{p.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-xl pt-lg border-t border-slate-100">
              <div className="flex justify-center items-end h-24 gap-1.5">
                {(dashboardStats?.trendData || [0,0,0,0,0,0,0]).map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all duration-700 ${i === 6 ? 'bg-secondary' : 'bg-slate-200'}`}
                    style={{ height: `${Math.max(h, 5)}%` }}
                    title={`${h}% of max`}
                  />
                ))}
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">7-Day Completion Trend</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 p-lg rounded-xl shadow-sm">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-lg">Recent Activity</h4>
            <div className="space-y-md">
              {recentActivity.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No recent activity</div>
              ) : recentActivity.map((activity) => (
                <div key={activity._id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                    {activity.user?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">
                      <span className="font-semibold text-primary">{activity.user?.name}</span> {activity.action}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => {
            setSelectedTask(null);
            setSelectedProject(null);
            fetchDashboard();
          }}
          onUpdate={async (taskId, updates) => {
            await updateTask(taskId, updates);
            setSelectedTask((prev) => ({ ...prev, ...updates }));
            fetchDashboard();
          }}
          currentProject={selectedProject}
          isOwner={selectedProject?.owner?._id === user?._id || selectedProject?.owner === user?._id}
        />
      )}
    </div>
  );
}
