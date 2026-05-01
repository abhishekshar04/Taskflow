import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function TaskDetailsModal({ task, onClose, onUpdate, currentProject, isOwner }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [task._id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/tasks/${task._id}/comments`);
      setComments(res.data.data.comments);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: newComment });
      setComments([res.data.data.comment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = (e) => {
    onUpdate(task._id, { status: e.target.value });
  };

  const handleAssigneeChange = (e) => {
    onUpdate(task._id, { assignee: e.target.value });
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-xl py-lg border-b border-outline-variant flex justify-between items-center bg-surface">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-primary">{task.title}</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content (Left) */}
          <div className="flex-1 p-xl overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-on-surface mb-2">Description</h3>
              <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                {task.description || <span className="italic text-slate-400">No description provided.</span>}
              </p>
            </div>

            <div className="border-t border-outline-variant pt-8">
              <h3 className="text-sm font-semibold text-on-surface mb-4">Comments</h3>
              
              <form onSubmit={handlePostComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="w-full px-md py-3 border border-outline-variant rounded-xl text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 resize-none mb-2"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {loadingComments ? (
                  <div className="text-center py-4 text-slate-400"><span className="material-symbols-outlined animate-spin">progress_activity</span></div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No comments yet.</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment._id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {comment.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 bg-surface-container p-3 rounded-2xl rounded-tl-sm">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-semibold text-primary">{comment.user?.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="w-64 bg-surface-container-lowest border-l border-outline-variant p-xl flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Status</label>
              <select
                value={task.status}
                onChange={handleStatusChange}
                className="w-full text-sm bg-surface-container border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                {(isOwner || task.status === 'done') && <option value="done">Done</option>}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Assignee
                {!isOwner && (
                  <span className="ml-1 text-[10px] text-slate-400 font-normal">(owner only)</span>
                )}
              </label>
              {isOwner ? (
                <select
                  value={task.assignee?._id || task.assignee || ''}
                  onChange={handleAssigneeChange}
                  className="w-full text-sm bg-surface-container border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary"
                >
                  <option value="">Unassigned</option>
                  {currentProject?.members?.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant px-3 py-2 bg-surface-container border border-outline-variant rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {(task.assignee?.name || 'U').charAt(0)}
                  </div>
                  <span>{task.assignee?.name || 'Unassigned'}</span>
                  <span className="material-symbols-outlined text-sm text-slate-400 ml-auto">lock</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Due Date</label>
              <div className="text-sm text-on-surface-variant px-3 py-2 bg-surface-container border border-outline-variant rounded-lg">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
              </div>
            </div>

            <div className="border-t border-outline-variant pt-6 mt-auto">
              <div className="text-[10px] text-slate-400">
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
