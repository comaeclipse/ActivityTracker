'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Shield,
  Users,
  Settings,
} from 'lucide-react';

// ─── tiny helpers ────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/40">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function StatusBanner({ type, message, onDismiss }: {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}) {
  const isSuccess = type === 'success';
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm animate-fadeIn ${
        isSuccess
          ? 'bg-secondary/10 border-secondary/30 text-secondary'
          : 'bg-red-500/10 border-red-500/30 text-red-600'
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      )}
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity text-xs font-medium">
        ✕
      </button>
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, placeholder }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Danger modal ─────────────────────────────────────────────────────────────

function DangerModal({ title, description, confirmLabel, onConfirm, onCancel, isDestructive = true }: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
  isDestructive?: boolean;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Please enter your password'); return; }
    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDestructive ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle className={`w-6 h-6 ${isDestructive ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <h3 className="text-lg font-bold text-foreground text-center mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">{description}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              id="confirm-password"
              label="Enter your password to confirm"
              value={password}
              onChange={setPassword}
              placeholder="Your current password"
            />
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 ${
                  isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {loading ? 'Processing…' : confirmLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  // Username
  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Community visibility
  const [hideFromCommunity, setHideFromCommunity] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [visibilityStatus, setVisibilityStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Danger zone modals
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setHideFromCommunity(user.hideFromCommunity ?? false);
    }
  }, [user]);

  if (!user) return null;

  // ── Username save ──
  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameLoading(true);
    setUsernameStatus(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update username');
      updateUser({ username: data.user.username });
      setUsernameStatus({ type: 'success', message: 'Username updated successfully!' });
    } catch (err: any) {
      setUsernameStatus({ type: 'error', message: err.message });
    } finally {
      setUsernameLoading(false);
    }
  };

  // ── Password save ──
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    setPasswordLoading(true);
    setPasswordStatus(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordStatus({ type: 'success', message: 'Password changed successfully!' });
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Visibility toggle ──
  const handleVisibilityToggle = async (checked: boolean) => {
    setHideFromCommunity(checked);
    setVisibilityLoading(true);
    setVisibilityStatus(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, hideFromCommunity: checked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update visibility');
      updateUser({ hideFromCommunity: checked });
      setVisibilityStatus({ type: 'success', message: checked ? 'You are now hidden from the community page.' : 'You are now visible on the community page.' });
    } catch (err: any) {
      setHideFromCommunity(!checked); // revert
      setVisibilityStatus({ type: 'error', message: err.message });
    } finally {
      setVisibilityLoading(false);
    }
  };

  // ── Wipe history ──
  const handleWipeHistory = async (password: string) => {
    const res = await fetch('/api/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, action: 'wipe_history', password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to wipe history');
    setShowWipeModal(false);
  };

  // ── Delete account ──
  const handleDeleteAccount = async (password: string) => {
    const res = await fetch('/api/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, action: 'delete_account', password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete account');
    logout();
    router.push('/login');
  };

  // ── Logout ──
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Danger modals */}
      {showWipeModal && (
        <DangerModal
          title="Wipe Activity History"
          description="This will permanently delete all your activities, weight logs, and goals. This action cannot be undone."
          confirmLabel="Wipe History"
          onConfirm={handleWipeHistory}
          onCancel={() => setShowWipeModal(false)}
          isDestructive
        />
      )}
      {showDeleteModal && (
        <DangerModal
          title="Delete Account"
          description="This will permanently delete your account and all associated data. You will not be able to recover it."
          confirmLabel="Delete My Account"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          isDestructive
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account preferences</p>
          </div>
        </div>

        {/* ── Account section ── */}
        <SectionCard title="Account" icon={User}>
          <form onSubmit={handleSaveUsername} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="settings-username" className="text-sm font-medium text-foreground">
                Username
              </label>
              <input
                id="settings-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">Letters, numbers, underscores, and hyphens only. 3–30 characters.</p>
            </div>
            {usernameStatus && (
              <StatusBanner
                type={usernameStatus.type}
                message={usernameStatus.message}
                onDismiss={() => setUsernameStatus(null)}
              />
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={usernameLoading || username === user.username}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {usernameLoading ? 'Saving…' : 'Save Username'}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Password section ── */}
        <SectionCard title="Password" icon={Lock}>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <PasswordInput
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
            />
            <PasswordInput
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 6 characters"
            />
            <PasswordInput
              id="confirm-new-password"
              label="Confirm new password"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              placeholder="Repeat new password"
            />
            {passwordStatus && (
              <StatusBanner
                type={passwordStatus.type}
                message={passwordStatus.message}
                onDismiss={() => setPasswordStatus(null)}
              />
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmNewPassword}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {passwordLoading ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Privacy section ── */}
        <SectionCard title="Privacy" icon={Users}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Hide from Community Page</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, your profile and activities won't appear in the community feed.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={hideFromCommunity}
              id="hide-from-community-toggle"
              disabled={visibilityLoading}
              onClick={() => handleVisibilityToggle(!hideFromCommunity)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                hideFromCommunity ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  hideFromCommunity ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {visibilityStatus && (
            <StatusBanner
              type={visibilityStatus.type}
              message={visibilityStatus.message}
              onDismiss={() => setVisibilityStatus(null)}
            />
          )}
        </SectionCard>

        {/* ── Session section ── */}
        <SectionCard title="Session" icon={Shield}>
          <button
            id="settings-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Log Out</p>
                <p className="text-xs text-muted-foreground">Sign out of your account on this device</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </SectionCard>

        {/* ── Danger zone ── */}
        <div className="bg-card border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="font-semibold text-red-700 dark:text-red-500">Danger Zone</h2>
          </div>
          <div className="p-6 space-y-3">
            <button
              id="wipe-history-btn"
              onClick={() => setShowWipeModal(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-700 dark:text-red-500">Wipe Activity History</p>
                  <p className="text-xs text-red-500/80 dark:text-red-400/80">Permanently delete all activities, weight logs, and goals</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 dark:text-red-600" />
            </button>

            <button
              id="delete-account-btn"
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-700 dark:text-red-500 font-semibold">Delete Account</p>
                  <p className="text-xs text-red-500/80 dark:text-red-400/80">Permanently remove your account and all data</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 dark:text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
