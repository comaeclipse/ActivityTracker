"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield, Users, Activity, ChevronRight, CalendarDays, Download, ChevronDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { getUserGradient } from '@/lib/utils';

type UserRow = {
  id: string;
  username: string;
  role: 'USER' | 'AUDITOR';
  createdAt: string;
  activityCount: number;
  lastActive: string | null;
  activityDates: string[];
};

// Parse "YYYY-MM-DD" into a local Date (avoids UTC midnight → previous day shift)
function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function UserCalendar({ dates }: { dates: string[] }) {
  const workoutDates = dates.map(parseDateStr);
  return (
    <Calendar
      modifiers={{ workout: workoutDates }}
      modifiersClassNames={{
        workout: '!bg-blue-500 !text-white rounded-full hover:!bg-blue-600 focus:!bg-blue-600',
      }}
      defaultMonth={workoutDates.at(-1) ?? new Date()}
    />
  );
}

export default function AuditorDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [exportAllOpen, setExportAllOpen] = useState(false);
  const [exportingAll, setExportingAll] = useState<'day' | 'user' | null>(null);
  const [exportingUserId, setExportingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'AUDITOR')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleExportAll = async (kind: 'day' | 'user') => {
    if (!user) return;
    setExportAllOpen(false);
    setExportingAll(kind);
    try {
      const res = await fetch(`/api/auditor/export?requestingUserId=${user.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (kind === 'day') {
        const { generateByDayPDF } = await import('@/lib/fitness-pdf-generator');
        generateByDayPDF(data.activities).save('activity-by-day.pdf');
      } else {
        const { generateByUserPDF } = await import('@/lib/fitness-pdf-generator');
        generateByUserPDF(data.activities).save('activity-by-user.pdf');
      }
    } catch {
      setError('Failed to export report');
    } finally {
      setExportingAll(null);
    }
  };

  const handleExportUser = async (u: UserRow) => {
    if (!user) return;
    setExportingUserId(u.id);
    try {
      const res = await fetch(`/api/auditor/users/${u.id}?requestingUserId=${user.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { generateActivityLogPDF } = await import('@/lib/fitness-pdf-generator');
      generateActivityLogPDF(data.activities, { username: u.username }).save(
        `${u.username}-activity-log.pdf`
      );
    } catch {
      setError('Failed to export report');
    } finally {
      setExportingUserId(null);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'AUDITOR') return;

    fetch(`/api/auditor/users?requestingUserId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setUsers(data.data);
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [user]);

  if (isLoading || !user) return null;

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalActivities = users.reduce((s, u) => s + u.activityCount, 0);
  const activeUsers = users.filter((u) => u.activityCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auditor Dashboard</h1>
            <p className="text-sm text-muted-foreground">View user activity and generate reports</p>
          </div>
        </div>

        {/* Export All */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setExportAllOpen((o) => !o)}
            disabled={exportingAll !== null || users.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exportingAll ? 'Generating…' : 'Export All'}
            <ChevronDown className="w-4 h-4" />
          </button>

          {exportAllOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportAllOpen(false)} />
              <div className="absolute right-0 mt-1 w-56 z-20 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={() => handleExportAll('day')}
                  className="w-full flex items-start gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>
                    By Day
                    <span className="block text-xs text-muted-foreground">
                      All users grouped per day
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => handleExportAll('user')}
                  className="w-full flex items-start gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left border-t border-border"
                >
                  <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>
                    By User
                    <span className="block text-xs text-muted-foreground">
                      Each user, chronological
                    </span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Activities</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalActivities}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Active Users</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
        </div>
      </div>

      {/* User List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <h2 className="font-semibold text-foreground">All Users</h2>
          <input
            type="text"
            placeholder="Search username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading users...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => router.push(`/auditor/${u.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className={`w-9 h-9 rounded-full ${getUserGradient(u.username)} flex-shrink-0`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{u.username}</span>
                      {u.role === 'AUDITOR' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          Auditor
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined {format(new Date(u.createdAt), 'MMM d, yyyy')}
                      {u.lastActive && ` · Last active ${format(new Date(u.lastActive), 'MMM d')}`}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3 flex-shrink-0 pl-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{u.activityCount}</p>
                    <p className="text-xs text-muted-foreground">activities</p>
                  </div>
                  <button
                    onClick={() => handleExportUser(u)}
                    disabled={exportingUserId === u.id || u.activityCount === 0}
                    title="Export activity log PDF"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {exportingUserId === u.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => router.push(`/auditor/${u.id}`)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="View user details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Calendars */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Activity Calendars</h2>
            <span className="text-xs text-muted-foreground ml-1">
              — blue dates are logged workouts
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="px-4 pt-4 pb-2 flex items-center gap-3 border-b border-border">
                  <div className={`w-8 h-8 rounded-full ${getUserGradient(u.username)} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.activityCount} activit{u.activityCount !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>
                </div>
                <UserCalendar dates={u.activityDates} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
