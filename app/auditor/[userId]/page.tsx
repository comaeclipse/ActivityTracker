"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Download, FileText, User, Activity, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

import type { ActivityRecord } from '@/lib/fitness-pdf-generator';

type ActivityRow = ActivityRecord & { createdAt: string };

type TargetUser = {
  id: string;
  username: string;
  role: 'USER' | 'AUDITOR';
  createdAt: string;
};

const ACTIVITY_COLORS: Record<string, string> = {
  RUN: 'bg-orange-100 text-orange-700 border-orange-200',
  WALK: 'bg-green-100 text-green-700 border-green-200',
  SWIM: 'bg-blue-100 text-blue-700 border-blue-200',
  WEIGHTS: 'bg-purple-100 text-purple-700 border-purple-200',
  BIKE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HYDRATION: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const ACTIVITY_TYPES = ['ALL', 'RUN', 'WALK', 'SWIM', 'WEIGHTS', 'BIKE', 'HYDRATION'];

export default function UserSnapshotPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [targetUser, setTargetUser] = useState<TargetUser | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState<'log' | 'summary' | null>(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'ALL',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'AUDITOR')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'AUDITOR') return;
    fetchData(appliedFilters);
  }, [user, userId, appliedFilters]);

  const fetchData = (f: typeof filters) => {
    setLoading(true);
    const params = new URLSearchParams({ requestingUserId: user!.id });
    if (f.startDate) params.set('startDate', f.startDate);
    if (f.endDate) params.set('endDate', f.endDate);
    if (f.type !== 'ALL') params.set('type', f.type);

    fetch(`/api/auditor/users/${userId}?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setTargetUser(data.user);
          setActivities(data.activities);
        }
      })
      .catch(() => setError('Failed to load snapshot'))
      .finally(() => setLoading(false));
  };

  const handleApplyFilters = () => setAppliedFilters({ ...filters });
  const handleClearFilters = () => {
    const cleared = { startDate: '', endDate: '', type: 'ALL' };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const handleDownloadLog = async () => {
    setGenerating('log');
    try {
      const { generateActivityLogPDF } = await import('@/lib/fitness-pdf-generator');
      const doc = generateActivityLogPDF(activities, {
        username: targetUser?.username,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });
      doc.save(`${targetUser?.username ?? 'user'}-activity-log.pdf`);
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadSummary = async () => {
    setGenerating('summary');
    try {
      const { generateSummaryPDF } = await import('@/lib/fitness-pdf-generator');
      const doc = generateSummaryPDF(activities, {
        username: targetUser?.username,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });
      doc.save(`${targetUser?.username ?? 'user'}-summary.pdf`);
    } finally {
      setGenerating(null);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push('/auditor')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Auditor Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  {targetUser?.username ?? '…'}
                </h1>
                {targetUser?.role === 'AUDITOR' && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    Auditor
                  </span>
                )}
              </div>
              {targetUser && (
                <p className="text-sm text-muted-foreground">
                  Member since {format(new Date(targetUser.createdAt), 'MMM d, yyyy')}
                  {' · '}
                  <span className="font-medium text-foreground">{activities.length}</span> activities shown
                </p>
              )}
            </div>
          </div>

          {/* PDF download buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadLog}
              disabled={activities.length === 0 || generating !== null}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              {generating === 'log' ? 'Generating…' : 'Activity Log PDF'}
            </button>
            <button
              onClick={handleDownloadSummary}
              disabled={activities.length === 0 || generating !== null}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {generating === 'summary' ? 'Generating…' : 'Summary PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              className="px-2 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              className="px-2 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Activity Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              className="px-2 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Activity table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity Log
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading activities...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No activities found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Value</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Duration</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">
                      {format(new Date(a.activityDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ACTIVITY_COLORS[a.type] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {a.value !== null ? `${a.value} ${a.unit ?? ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {a.durationMinutes !== null ? `${a.durationMinutes} min` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {a.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
