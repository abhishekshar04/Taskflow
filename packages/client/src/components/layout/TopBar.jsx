import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

const STATUS_META = {
  'todo':        { label: 'To Do',       color: 'text-slate-500',  bg: 'bg-slate-100'  },
  'in-progress': { label: 'In Progress', color: 'text-blue-600',   bg: 'bg-blue-100'   },
  'done':        { label: 'Done',        color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

const PRIORITY_META = {
  low:    { color: 'text-slate-500'  },
  medium: { color: 'text-amber-600'  },
  high:   { color: 'text-red-600'    },
};

export default function TopBar() {
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // ── Notifications ──────────────────────────────────────────────────────
  const [notifications,     setNotifications]     = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await api.get('/users/notifications');
      setNotifications(res.data.data.notifications || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 30000);
    return () => clearInterval(iv);
  }, [user, fetchNotifs]);

  const handleMarkOne = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/users/notifications/${id}/read`);
      setNotifications((p) => p.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch { /* silent */ }
  };

  const handleMarkAll = async () => {
    try {
      await api.patch('/users/notifications/read-all');
      setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  // ── Search ─────────────────────────────────────────────────────────────
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState(null);   // null = closed, {} = open
  const [searching,   setSearching]   = useState(false);
  const searchRef  = useRef(null);
  const debounceRef = useRef(null);

  const totalResults = results
    ? (results.tasks?.length || 0) + (results.projects?.length || 0) + (results.members?.length || 0)
    : 0;

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(val.trim())}`);
        setResults(res.data.data);
      } catch { setResults({ tasks: [], projects: [], members: [] }); }
      finally { setSearching(false); }
    }, 320);
  };

  const clearSearch = () => { setQuery(''); setResults(null); };

  const goToTask    = (task)    => { clearSearch(); navigate(`/projects/${task.project?._id || task.project}`); };
  const goToProject = (project) => { clearSearch(); navigate(`/projects/${project._id}`); };
  const goToTeam    = ()        => { clearSearch(); navigate('/team'); };

  // Close search on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setResults(null);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const highlight = (text = '', q = '') => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <header className="fixed top-0 right-0 left-[260px] h-16 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center justify-between px-8">

      {/* ── Search bar ── */}
      <div className="flex items-center flex-1" ref={searchRef}>
        <div className="relative w-full max-w-lg">
          {/* Input */}
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            id="global-search"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => query.trim().length >= 2 && setResults(results || {})}
            placeholder="Search tasks, projects, or team members..."
            type="text"
            autoComplete="off"
            className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-transparent focus:border-blue-300 focus:bg-white rounded-lg text-sm placeholder:text-slate-400 outline-none transition-all"
          />
          {/* Clear / Spinner */}
          {searching ? (
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] animate-spin">progress_activity</span>
          ) : query && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}

          {/* ── Dropdown results ── */}
          {results && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[480px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              {totalResults === 0 && !searching ? (
                <div className="p-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">search_off</span>
                  <p className="text-sm text-slate-400">No results for <span className="font-semibold">"{query}"</span></p>
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto">

                  {/* Tasks */}
                  {results.tasks?.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">task_alt</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tasks</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{results.tasks.length}</span>
                      </div>
                      {results.tasks.map((task) => {
                        const sm = STATUS_META[task.status] || STATUS_META['todo'];
                        const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                        return (
                          <button
                            key={task._id}
                            onClick={() => goToTask(task)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className={`w-7 h-7 rounded-lg ${sm.bg} flex items-center justify-center flex-shrink-0`}>
                              <span className={`material-symbols-outlined text-[15px] ${sm.color}`}>
                                {task.status === 'done' ? 'check_circle' : task.status === 'in-progress' ? 'pending' : 'radio_button_unchecked'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{highlight(task.title, query)}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400 truncate">{task.project?.name}</span>
                                <span className={`text-[10px] font-semibold ${pm.color}`}>● {task.priority}</span>
                                {task.assignee && <span className="text-[10px] text-slate-400">→ {task.assignee.name}</span>}
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sm.bg} ${sm.color} flex-shrink-0`}>{sm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Projects */}
                  {results.projects?.length > 0 && (
                    <div className={results.tasks?.length > 0 ? 'border-t border-slate-100' : ''}>
                      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">folder</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Projects</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{results.projects.length}</span>
                      </div>
                      {results.projects.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => goToProject(p)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: p.color || '#0058be' }}
                          >
                            <span className="material-symbols-outlined text-[15px] text-white">folder</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{highlight(p.name, query)}</p>
                            {p.description && (
                              <p className="text-[11px] text-slate-400 truncate">{p.description}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{p.members?.length || 0} members</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Members */}
                  {results.members?.length > 0 && (
                    <div className={(results.tasks?.length > 0 || results.projects?.length > 0) ? 'border-t border-slate-100' : ''}>
                      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">group</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Team Members</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{results.members.length}</span>
                      </div>
                      {results.members.map((m) => (
                        <button
                          key={m._id}
                          onClick={goToTeam}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {m.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{highlight(m.name, query)}</p>
                            <p className="text-[11px] text-slate-400 truncate">{highlight(m.email, query)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-[10px] text-slate-400 capitalize">{m.role}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer hint */}
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"</span>
                    <span className="text-[11px] text-slate-400">Press <kbd className="bg-white border border-slate-200 rounded px-1 text-[10px]">Esc</kbd> to close</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right-side controls ── */}
      <div className="flex items-center gap-4">

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="hover:bg-slate-50 rounded-full p-2 transition-colors relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-slate-500">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-error text-white font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAll} className="text-xs font-semibold text-secondary hover:text-blue-800 flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-sm">done_all</span>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">notifications_off</span>
                    <p className="text-sm text-slate-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`flex gap-3 px-4 py-3 transition-colors ${n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/60 hover:bg-blue-50'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${n.isRead ? 'bg-slate-200 text-slate-500' : 'bg-secondary-container text-on-secondary-container'}`}>
                        {n.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">
                          <span className="font-semibold">{n.user?.name}</span>{' '}{n.action}
                          {n.project?.name && <> in <span className="font-semibold">{n.project.name}</span></>}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        {!n.isRead ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-secondary mt-1" title="Unread" />
                            <button onClick={(e) => handleMarkOne(n._id, e)} title="Mark as read" className="text-slate-300 hover:text-secondary transition-colors mt-auto">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            </button>
                          </>
                        ) : (
                          <span className="material-symbols-outlined text-[16px] text-slate-300 mt-1" title="Read">check_circle</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                <button onClick={() => setShowNotifications(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">Close</button>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => alert('Help Center is coming soon!')} className="hover:bg-slate-50 rounded-full p-2 transition-colors">
          <span className="material-symbols-outlined text-slate-500">help_outline</span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-slate-900 leading-none text-sm font-semibold">{user?.name}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
