import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [preferences, setPreferences] = useState({
    notif_task: user?.preferences?.notif_task ?? true,
    notif_mention: user?.preferences?.notif_mention ?? true,
    notif_deadline: user?.preferences?.notif_deadline ?? false,
    notif_digest: user?.preferences?.notif_digest ?? false
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      const res = await api.put(`/users/${user._id}`, { name: form.name, preferences });
      updateUser(res.data.data.user);
      setProfileMsg('✅ Profile updated successfully.');
    } catch (err) {
      setProfileMsg('❌ ' + (err.response?.data?.message || 'Update failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) {
      setPassMsg('❌ New passwords do not match.');
      return;
    }
    if (passForm.newPassword.length < 6) {
      setPassMsg('❌ Password must be at least 6 characters.');
      return;
    }
    setPassMsg('⚙️ Changing password...');
    try {
      await api.post('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      setPassMsg('✅ Password changed successfully.');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPassMsg('❌ ' + (err.response?.data?.message || 'Failed to change password.'));
    }
  };

  const handlePreferenceChange = (id) => {
    setPreferences(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;
    try {
      await api.delete(`/users/${user._id}`);
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      {/* Header */}
      <div className="mb-xl">
        <h1 className="text-4xl font-bold text-primary mb-xs tracking-tight">Settings</h1>
        <p className="text-on-primary-container">Manage your account preferences and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left — Profile card */}
        <div className="lg:col-span-4 space-y-gutter">
          {/* Avatar */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-xl mb-md">
              {initials}
            </div>
            <h3 className="text-xl font-semibold text-primary">{user?.name}</h3>
            <p className="text-sm text-on-surface-variant mt-xs">{user?.email}</p>
            <span className={`mt-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              user?.role === 'admin' ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-600'
            }`}>
              {user?.role === 'admin' ? '⚡ Administrator' : '👤 Member'}
            </span>
            <div className="mt-lg w-full pt-lg border-t border-outline-variant text-left space-y-sm">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Member since</span>
                <span className="font-medium text-primary">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Account status</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Active
                </span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-error-container/20 border border-error/20 rounded-xl p-md">
            <h4 className="text-sm font-bold text-error mb-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              Danger Zone
            </h4>
            <p className="text-xs text-on-error-container mb-md">Deleting your account is permanent and cannot be undone.</p>
            <button onClick={handleDeleteAccount} className="w-full py-2 border border-error/40 text-error rounded-lg text-xs font-semibold hover:bg-error/10 transition-colors">
              Delete Account
            </button>
          </div>
        </div>

        {/* Right — Forms */}
        <div className="lg:col-span-8 space-y-gutter">
          {/* Profile Info */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-xs">Profile Information</h3>
            <p className="text-sm text-on-surface-variant mb-xl">Update your display name. Email changes require verification.</p>

            {profileMsg && (
              <div className={`mb-lg px-md py-sm rounded-lg text-sm font-medium ${
                profileMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-error-container text-on-error-container'
              }`}>{profileMsg}</div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-xs">Full Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary/10 focus:border-secondary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-xs">Work Email</label>
                  <input value={form.email} disabled
                    className="w-full px-md py-3 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface-variant cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-xs">Role</label>
                <input value={user?.role === 'admin' ? 'Administrator' : 'Member'} disabled
                  className="w-full px-md py-3 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface-variant cursor-not-allowed" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving}
                  className="px-xl py-sm bg-primary text-white font-semibold text-sm rounded-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2">
                  {saving ? <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-xs">Change Password</h3>
            <p className="text-sm text-on-surface-variant mb-xl">Use a strong password with at least 6 characters.</p>

            {passMsg && (
              <div className={`mb-lg px-md py-sm rounded-lg text-sm font-medium ${
                passMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' :
                passMsg.startsWith('⚙️') ? 'bg-blue-50 text-blue-700' : 'bg-error-container text-on-error-container'
              }`}>{passMsg}</div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-lg">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-xs">Current Password</label>
                <input type="password" value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary/10 focus:border-secondary outline-none transition-all" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-xs">New Password</label>
                  <input type="password" value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary/10 focus:border-secondary outline-none transition-all" placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-xs">Confirm Password</label>
                  <input type="password" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                    className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary/10 focus:border-secondary outline-none transition-all" placeholder="Repeat new password" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit"
                  className="px-xl py-sm bg-primary text-white font-semibold text-sm rounded-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">lock_reset</span>
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Preferences */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-xl">Notification Preferences</h3>
            <div className="space-y-md">
              {[
                { id: 'notif_task', label: 'Task assigned to me', sub: 'Get notified when a task is assigned to you' },
                { id: 'notif_mention', label: 'Mentions & comments', sub: 'Receive alerts when someone mentions you' },
                { id: 'notif_deadline', label: 'Upcoming deadlines', sub: 'Reminder 24 hours before a task is due' },
                { id: 'notif_digest', label: 'Weekly digest', sub: 'Summary of your activity every Monday' },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between py-sm border-b border-outline-variant last:border-0">
                  <div>
                    <p className="text-sm font-medium text-primary">{pref.label}</p>
                    <p className="text-xs text-on-surface-variant">{pref.sub}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={preferences[pref.id]} onChange={() => handlePreferenceChange(pref.id)} className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-secondary transition-colors
                      after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                </div>
              ))}
              <div className="flex justify-end mt-4">
                <button onClick={handleProfileSave} disabled={saving} className="px-xl py-sm bg-primary text-white font-semibold text-sm rounded-lg hover:bg-slate-800 transition-all">Save Preferences</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
