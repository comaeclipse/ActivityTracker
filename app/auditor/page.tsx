"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield, Users, Activity, ChevronRight, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

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

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'AUDITOR')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

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
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditor Dashboard</h1>
          <p className="text-sm text-muted-foreground">View user activity and generate reports</p>
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
              <button
                key={u.id}
                onClick={() => router.push(`/auditor/${u.id}`)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
                  <div>
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
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{u.activityCount}</p>
                    <p className="text-xs text-muted-foreground">activities</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
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
