import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signup(form);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-xl border border-outline-variant">
        <div className="flex items-center gap-base mb-xl">
          <span className="material-symbols-outlined text-3xl text-secondary">task_alt</span>
          <span className="text-2xl font-bold text-primary tracking-tighter">TaskFlow</span>
        </div>
        <h2 className="text-2xl font-semibold text-on-surface mb-xs">Create your account</h2>
        <p className="text-sm text-on-surface-variant mb-xl">Join your team and start managing tasks.</p>

        {error && (
          <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg text-sm">{error}</div>
        )}

        <form className="space-y-lg" onSubmit={handleSubmit}>
          <div className="space-y-xs">
            <label className="text-sm font-semibold text-on-surface">Full Name</label>
            <input
              type="text"
              placeholder="Alex Rivera"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-xs">
            <label className="text-sm font-semibold text-on-surface">Work Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-xs">
            <label className="text-sm font-semibold text-on-surface">Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-lg bg-primary text-white font-semibold text-sm rounded-lg hover:bg-tertiary active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-lg text-center text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
