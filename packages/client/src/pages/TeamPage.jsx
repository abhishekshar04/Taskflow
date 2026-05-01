import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function TeamPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [projectFilters, setProjectFilters] = useState({});
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.data.projects || []);
        const expanded = {};
        const filters = {};
        (res.data.data.projects || []).forEach((p) => {
          expanded[p._id] = true;
          filters[p._id] = 'all';
        });
        setExpandedProjects(expanded);
        setProjectFilters(filters);
      } catch (err) {
        console.error('Team fetch error:', err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleProject = (id) =>
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));

  const setProjectFilter = (id, val) =>
    setProjectFilters((prev) => ({ ...prev, [id]: val }));

  const handleRemoveMember = async (projectId, userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? { ...p, members: p.members.filter((m) => m.user?._id !== userId) }
            : p
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot remove member');
    }
  };

  const roleLabel = (r) => ({ owner: 'Owner', member: 'Member', admin: 'Admin' }[r] || r);
  const roleColor = (r) =>
    ({ owner: 'bg-violet-100 text-violet-700', member: 'bg-slate-100 text-slate-600', admin: 'bg-amber-100 text-amber-700' }[r] || 'bg-slate-100 text-slate-600');

  const filterMembers = (members, projectId) => {
    const f = projectFilters[projectId] || 'all';
    if (f === 'owner') return members.filter((m) => m.role === 'owner');
    if (f === 'member') return members.filter((m) => m.role === 'member');
    return members;
  };

  const isProjectOwner = (project) =>
    project.owner?._id === currentUser?._id || project.owner === currentUser?._id;

  return (
    <div>
      {/* Header */}
      <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm mb-lg">
        <h2 className="text-3xl font-semibold text-primary">Team Members</h2>
      </div>

      <div className="space-y-lg">
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant bg-white rounded-xl border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-5xl block mb-3 text-slate-300 animate-spin">progress_activity</span>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant bg-white rounded-xl border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-5xl block mb-3 text-slate-300">folder_off</span>
            No projects found.
          </div>
        ) : (
          projects.map((project) => {
            const visible = filterMembers(project.members || [], project._id);
            const ownerFlag = isProjectOwner(project);
            const ownerCount = (project.members || []).filter((m) => m.role === 'owner').length;
            const memberCount = (project.members || []).filter((m) => m.role === 'member').length;
            const total = project.members?.length || 0;

            return (
              <div key={project._id} className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">

                {/* Project header row */}
                <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant">
                  <button
                    onClick={() => toggleProject(project._id)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: project.color || '#0058be' }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-primary">{project.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {total} member{total !== 1 ? 's' : ''}
                        {ownerFlag && (
                          <span className="ml-2 text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">You own this</span>
                        )}
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-on-surface-variant transition-transform duration-200 ml-2"
                      style={{ transform: expandedProjects[project._id] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Per-project filter pills */}
                  <div className="flex items-center gap-1 ml-4">
                    {[['all', 'All'], ['owner', 'Owners'], ['member', 'Members']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setProjectFilter(project._id, val)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                          (projectFilters[project._id] || 'all') === val
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Members table */}
                {expandedProjects[project._id] && (
                  <>
                    {visible.length === 0 ? (
                      <div className="px-lg py-md text-sm text-slate-400">No members match this filter.</div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-lowest text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                            <th className="p-md">Member</th>
                            <th className="p-md">Project Role</th>
                            <th className="p-md">Status</th>
                            <th className="p-md">Last Active</th>
                            {ownerFlag && <th className="p-md text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {visible.map((m) => (
                            <tr key={m.user?._id || m._id} className="hover:bg-surface-container-lowest transition-colors">
                              <td className="p-md">
                                <div className="flex items-center gap-md">
                                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {m.user?.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-primary">{m.user?.name}</p>
                                    <p className="text-xs text-on-surface-variant">{m.user?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-md">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColor(m.role)}`}>
                                  {roleLabel(m.role)}
                                </span>
                              </td>
                              <td className="p-md">
                                <div className="flex items-center gap-xs">
                                  <div className={`w-2 h-2 rounded-full ${m.user?.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                  <span className={`text-xs font-medium ${m.user?.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                                    {m.user?.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-md text-xs text-on-surface-variant">
                                {m.user?.lastActive ? new Date(m.user.lastActive).toLocaleDateString() : '—'}
                              </td>
                              {ownerFlag && (
                                <td className="p-md text-right">
                                  {m.user?._id !== currentUser?._id && m.role !== 'owner' ? (
                                    <button
                                      onClick={() => handleRemoveMember(project._id, m.user._id)}
                                      className="flex items-center gap-1 px-3 py-1.5 text-error hover:bg-error-container/20 rounded-lg transition-colors ml-auto text-xs font-semibold"
                                    >
                                      <span className="material-symbols-outlined text-sm">person_remove</span>
                                      Remove
                                    </button>
                                  ) : (
                                    <span />
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Per-project Role Breakdown footer */}
                    <div className="border-t border-outline-variant bg-surface-container-lowest px-lg py-md">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-secondary text-base">shield</span>
                        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Role Breakdown</span>
                        <span className="ml-auto text-[10px] text-on-surface-variant">{total} total</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Owners',  count: ownerCount,  color: 'bg-violet-500' },
                          { label: 'Members', count: memberCount, color: 'bg-secondary'   },
                        ].map((r) => (
                          <div key={r.label} className="bg-white rounded-lg p-3 border border-outline-variant">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-on-surface-variant">{r.label}</span>
                              <span className="text-sm font-bold text-primary">{r.count}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${r.color} rounded-full transition-all duration-500`}
                                style={{ width: `${total > 0 ? (r.count / total) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
