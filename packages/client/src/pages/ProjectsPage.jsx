import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';

const statusColor = (s) => ({ active: 'bg-secondary-fixed text-secondary', archived: 'bg-surface-container-high text-on-surface-variant' }[s] || 'bg-slate-100 text-slate-600');

export default function ProjectsPage() {
  const { projects, fetchProjects, createProject, loading } = useProjectStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', priority: 'medium', deadline: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const p = await createProject(form);
      setShowModal(false);
      setForm({ name: '', description: '', priority: 'medium', deadline: '' });
      navigate(`/projects/${p._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-xl">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-xs tracking-tight">Active Projects</h1>
          <p className="text-on-primary-container">Monitor progress and team activity across all live initiatives.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-lg py-sm rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined">create_new_folder</span>
          New Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-on-surface-variant">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-300 block mb-4">folder_open</span>
          <p className="text-on-surface-variant text-lg font-medium">No projects yet.</p>
          <button onClick={() => setShowModal(true)} className="mt-4 bg-secondary text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-gutter">
          {projects.map((project, i) => (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className={`cursor-pointer rounded-xl p-lg border transition-all group hover:shadow-lg active:scale-[0.99] ${
                i === 0
                  ? 'col-span-12 lg:col-span-8 bg-surface-container-lowest border-outline-variant shadow-sm'
                  : i === 1
                  ? 'col-span-12 lg:col-span-4 bg-primary text-white border-transparent shadow-lg relative overflow-hidden'
                  : 'col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-lowest border-outline-variant shadow-sm'
              }`}
            >
              {i === 1 ? (
                <>
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                  <span className="text-xs font-bold text-on-primary-container uppercase tracking-widest">Active Sprint</span>
                  <h3 className="text-2xl font-semibold mt-base mb-xl">{project.name}</h3>
                  <div className="space-y-md text-sm">
                    <div className="flex justify-between"><span className="opacity-70">Status</span><span className="font-semibold capitalize">{project.status}</span></div>
                    <div className="flex justify-between"><span className="opacity-70">Members</span><span className="font-semibold">{project.members?.length || 0}</span></div>
                  </div>
                  <div className="pt-xl border-t border-white/10 mt-xl">
                    <button className="w-full py-base bg-white text-primary rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">View Board</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-md">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {i === 0 ? 'rocket_launch' : 'folder'}
                        </span>
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-xs inline-block ${statusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <h3 className="text-xl font-semibold text-primary">{project.name}</h3>
                      </div>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-sm text-on-surface-variant mb-xl max-w-2xl line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex flex-wrap items-end justify-between gap-lg pt-lg border-t border-outline-variant">
                    <div className="flex -space-x-3">
                      {project.members?.slice(0, 4).map((m, mi) => (
                        <div key={mi} className="w-9 h-9 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-white text-xs font-bold">
                          {m.user?.name?.charAt(0) || '?'}
                        </div>
                      ))}
                      {project.members?.length > 4 && (
                        <div className="w-9 h-9 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-xs font-bold text-outline">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                    {project.deadline && (
                      <span className="text-xs text-on-surface-variant font-medium">
                        Due {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-2xl font-semibold text-primary">New Project</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-lg">
              <div>
                <label className="text-sm font-semibold text-on-surface block mb-xs">Project Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all" required placeholder="e.g. Platform Revamp" />
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface block mb-xs">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all resize-none" rows={3} placeholder="What is this project about?" />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="text-sm font-semibold text-on-surface block mb-xs">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm outline-none focus:border-secondary transition-all bg-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-on-surface block mb-xs">Deadline</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-md py-3 border border-outline-variant rounded-lg text-sm outline-none focus:border-secondary transition-all" />
                </div>
              </div>
              <div className="flex gap-md pt-md">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
