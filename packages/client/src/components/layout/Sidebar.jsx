import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/projects', icon: 'assignment', label: 'Projects' },
  { to: '/team', icon: 'group', label: 'Team' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] z-50 bg-[#1e293b] border-r border-slate-800 shadow-xl flex flex-col py-6">
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-white">task_alt</span>
          </div>
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">TaskFlow</h1>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest opacity-60">Enterprise Edition</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-white bg-blue-600/10 border-l-4 border-blue-500'
                  : 'text-slate-400 opacity-70 hover:opacity-100 hover:bg-slate-800/50'
              }`
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-label-md text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-6 mt-auto space-y-3">
        <button
          onClick={() => navigate('/projects')}
          className="w-full bg-secondary text-white py-3 rounded-lg font-label-md flex items-center justify-center gap-2 hover:bg-on-secondary-fixed-variant transition-all active:scale-95 text-sm font-semibold"
        >
          <span className="material-symbols-outlined">add</span>
          Add Task
        </button>
        {user && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-xs font-semibold truncate max-w-[100px]">{user.name}</p>
                <p className="text-slate-400 text-[10px] uppercase">{user.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white p-1 rounded transition-colors" title="Logout">
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
