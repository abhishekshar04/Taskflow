import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full h-screen flex flex-row">
      {/* Brand / Left panel */}
      <section className="hidden lg:flex w-1/2 relative flex-col justify-between p-xl bg-primary-container text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYexlcd9Z5lU3e5xNYKMddnZ91174tzW7PLdAShpnqqnhBBRS0VaCnuj4BxQIq4DDlmOAkIacRnzgfyLu6ntiIoPdb5ki6a5yMtRUV5nmqCgEdevSC-3om8wPyGF6FSYfakHKiF8bheEJcE8svbkKZejfhGbGZJB6S45LfbvyvCxtiQg-_JgShPFBIokns-dfnTGjZj0G8uguCbDIWt8jcCNZq-n5cXUEYMeZp4VuJLilPe9CatsEAV-FEwhxr1Z9I5JIEJdYKATo"
            alt="Corporate office"
          />
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary via-primary-container/80 to-secondary/20"></div>
        <div className="relative z-20">
          <div className="flex items-center gap-base">
            <span className="material-symbols-outlined text-4xl text-secondary-fixed">task_alt</span>
            <h1 className="text-4xl font-bold tracking-tighter">TaskFlow</h1>
          </div>
          <div className="mt-xl max-w-md">
            <h2 className="text-3xl font-semibold mb-md">Enterprise Efficiency. Simplified.</h2>
            <p className="text-lg text-on-primary-container">
              Command your projects with professional-grade tools designed for high-performance teams. Clarity, speed, and focus integrated into a single source of truth.
            </p>
          </div>
        </div>
        <div className="relative z-20 pb-xl">
          <div className="grid grid-cols-2 gap-lg">
            <div className="bg-white/5 backdrop-blur-sm p-md rounded-xl border border-white/10">
              <span className="text-2xl font-semibold block mb-xs text-secondary-fixed">99.9%</span>
              <p className="text-xs font-medium tracking-widest text-on-primary-container">System Uptime</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-md rounded-xl border border-white/10">
              <span className="text-2xl font-semibold block mb-xs text-secondary-fixed">25k+</span>
              <p className="text-xs font-medium tracking-widest text-on-primary-container">Active Organizations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form / Right panel */}
      <section className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-surface-container-lowest p-margin lg:p-xl">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-base mb-xl">
            <span className="material-symbols-outlined text-3xl text-secondary">task_alt</span>
            <span className="text-3xl font-bold text-primary tracking-tighter">TaskFlow</span>
          </div>
          <div className="mb-xl">
            <h2 className="text-3xl font-semibold text-on-surface mb-xs">Welcome back</h2>
            <p className="text-base text-on-surface-variant">Please enter your credentials to access the Dashboard.</p>
          </div>

          {error && (
            <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-lg" onSubmit={handleSubmit}>
            <div className="space-y-xs">
              <label className="text-sm font-semibold text-on-surface" htmlFor="email">Work Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-xl pr-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                  required
                />
              </div>
            </div>
            <div className="space-y-xs">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-on-surface" htmlFor="password">Password</label>
                <a href="#" className="text-xs font-medium text-secondary hover:underline">Forgot password?</a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">lock</span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-xl pr-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-[20px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-lg bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-tertiary active:scale-[0.98] transition-all flex items-center justify-center gap-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-xl text-center text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/signup" className="text-secondary font-semibold hover:underline">Create Account</Link>
          </p>
        </div>
        <footer className="mt-auto pt-xl w-full max-w-md flex justify-between text-xs text-on-tertiary-container">
          <span>© 2024 TaskFlow Enterprise</span>
          <div className="flex gap-md">
            <a href="#" className="hover:text-on-surface transition-colors">Privacy</a>
            <a href="#" className="hover:text-on-surface transition-colors">Terms</a>
          </div>
        </footer>
      </section>
    </main>
  );
}
