'use client';

import { useState, useEffect } from 'react';
import { Flame, Clock, TrendingUp, Award, Dumbbell, Waves, Bike, Droplets, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type WeeklyPoint  = { label: string; minutes: number };
type MonthlyPoint = { month: string; minutes: number };
type MixPoint     = { type: string; count: number };
type BestPoint    = {
  type: string;
  count: number;
  totalMinutes: number;
  bestValue: number | null;
  bestUnit: string | null;
  bestDuration: number | null;
};
type AnalyticsData = {
  totalWorkouts: number;
  totalMinutes: number;
  activitiesThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  weeklyData: WeeklyPoint[];
  monthlyData: MonthlyPoint[];
  workoutMix: MixPoint[];
  heatmap: number[][];
  bests: BestPoint[];
};

// ─── ACTIVITY TYPE CONFIG ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { name: string; color: string; Icon: React.ElementType }> = {
  RUN:       { name: 'Running',   color: '#3b82f6', Icon: TrendingUp },
  WALK:      { name: 'Walking',   color: '#22c55e', Icon: TrendingUp },
  SWIM:      { name: 'Swimming',  color: '#06b6d4', Icon: Waves      },
  WEIGHTS:   { name: 'Strength',  color: '#a855f7', Icon: Dumbbell   },
  BIKE:      { name: 'Cycling',   color: '#f59e0b', Icon: Bike       },
  HYDRATION: { name: 'Hydration', color: '#14b8a6', Icon: Droplets   },
  ROW:       { name: 'Rowing',    color: '#ef4444', Icon: Waves      },
};

const FALLBACK_TYPE = { name: 'Other', color: '#94a3b8', Icon: Zap };

// ─── CHARTS ──────────────────────────────────────────────────────────────────

function WeeklyMinutesChart({ data }: { data: WeeklyPoint[] }) {
  const maxVal = Math.max(...data.map(d => d.minutes), 60);
  const chartH = 120;
  const baseY = 142;
  const startX = 36;
  const slotW = 54;
  const barW = 32;
  const padX = (slotW - barW) / 2;
  const gridVals = [0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f));
  const highestVal = Math.max(...data.map(d => d.minutes));

  return (
    <svg viewBox="0 0 480 175" className="w-full" aria-label="Weekly minutes bar chart">
      {gridVals.map((val) => {
        const y = baseY - (val / maxVal) * chartH;
        return (
          <g key={val}>
            <line x1={startX} y1={y} x2="472" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <text x={startX - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#94a3b8">{val}</text>
          </g>
        );
      })}
      <line x1={startX} y1={baseY} x2="472" y2={baseY} stroke="#e2e8f0" strokeWidth="1" />
      {data.map((d, i) => {
        const barH = Math.max((d.minutes / maxVal) * chartH, d.minutes > 0 ? 1 : 0);
        const rectX = startX + i * slotW + padX;
        const rectY = baseY - barH;
        const cx = rectX + barW / 2;
        const isHighest = d.minutes > 0 && d.minutes === highestVal;
        const [mo, wn] = d.label.split(' ');
        return (
          <g key={i}>
            <rect
              x={rectX} y={rectY} width={barW} height={barH} rx="4" ry="4"
              fill={isHighest ? '#1d4ed8' : '#3b82f6'}
              fillOpacity={0.75 + (i / data.length) * 0.25}
            />
            {isHighest && (
              <text x={cx} y={rectY - 5} textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="600">
                {d.minutes}
              </text>
            )}
            <text x={cx} y={baseY + 13} textAnchor="middle" fontSize="8.5" fill="#64748b">{wn}</text>
            <text x={cx} y={baseY + 23} textAnchor="middle" fontSize="7.5" fill="#94a3b8">{mo}</text>
          </g>
        );
      })}
    </svg>
  );
}

function MonthlyProgressChart({ data }: { data: MonthlyPoint[] }) {
  if (data.length < 2) return (
    <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
      Not enough data yet
    </div>
  );

  const maxVal = Math.max(...data.map(d => d.minutes), 60);
  const chartH = 120;
  const padTop = 20;
  const padLeft = 40;
  const padRight = 15;
  const totalW = 500;
  const n = data.length;
  const xSpacing = (totalW - padLeft - padRight) / (n - 1);

  const getX = (i: number) => padLeft + i * xSpacing;
  const getY = (val: number) => padTop + chartH - (val / maxVal) * chartH;

  const pointsStr = data.map((d, i) => `${getX(i)},${getY(d.minutes)}`).join(' ');
  const areaD =
    `M ${getX(0)},${getY(data[0].minutes)} ` +
    data.slice(1).map((d, i) => `L ${getX(i + 1)},${getY(d.minutes)}`).join(' ') +
    ` L ${getX(n - 1)},${padTop + chartH} L ${getX(0)},${padTop + chartH} Z`;

  const gridVals = [0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f));

  return (
    <svg viewBox={`0 0 ${totalW} 175`} className="w-full" aria-label="Monthly minutes line chart">
      <defs>
        <linearGradient id="monthlyAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {gridVals.map((val) => {
        const y = getY(val);
        return (
          <g key={val}>
            <line x1={padLeft} y1={y} x2={totalW - padRight} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <text x={padLeft - 5} y={y + 4} textAnchor="end" fontSize="8" fill="#94a3b8">{val}</text>
          </g>
        );
      })}
      <line x1={padLeft} y1={padTop + chartH} x2={totalW - padRight} y2={padTop + chartH} stroke="#e2e8f0" strokeWidth="1" />
      <path d={areaD} fill="url(#monthlyAreaGrad)" />
      <polyline points={pointsStr} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.month}>
          <circle cx={getX(i)} cy={getY(d.minutes)} r="4.5" fill="#22c55e" stroke="white" strokeWidth="2" />
          <text x={getX(i)} y={padTop + chartH + 16} textAnchor="middle" fontSize="9.5" fill="#64748b">{d.month}</text>
          <text x={getX(i)} y={padTop + chartH + 27} textAnchor="middle" fontSize="8.5" fill="#94a3b8">{d.minutes}</text>
        </g>
      ))}
    </svg>
  );
}

function DonutChart({ data }: { data: MixPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
        No activities yet
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = 80, cy = 80, r = 58;
  const C = 2 * Math.PI * r;

  let cumulative = 0;
  const segments = data.map((d) => {
    const cfg = TYPE_CONFIG[d.type] ?? FALLBACK_TYPE;
    const len = (d.count / total) * C;
    const seg = { ...d, name: cfg.name, color: cfg.color, len, offset: cumulative };
    cumulative += len;
    return seg;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg viewBox="0 0 160 160" className="w-36 h-36 flex-shrink-0" aria-label="Activity type donut chart">
        {segments.map((seg) => (
          <circle
            key={seg.type}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={22}
            strokeDasharray={`${seg.len} ${C - seg.len}`}
            strokeDashoffset={C - seg.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="bold" fill="#0f172a">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">activities</text>
      </svg>
      <div className="space-y-2.5 flex-1 w-full min-w-0">
        {segments.map((seg) => {
          const pct = Math.round((seg.count / total) * 100);
          return (
            <div key={seg.type} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-foreground flex-1">{seg.name}</span>
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden flex-shrink-0">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: seg.color }} />
              </div>
              <span className="text-xs text-muted-foreground w-7 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const heatColors = ['#f1f5f9', '#bfdbfe', '#60a5fa', '#2563eb'];

function HeatmapChart({ data }: { data: number[][] }) {
  const cellSize = 13;
  const gap = 2;
  const step = cellSize + gap;
  const padLeft = 16;
  const rows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const width = padLeft + data.length * step;
  const height = 7 * step - gap;

  return (
    <svg viewBox={`0 0 ${width + 4} ${height + 4}`} className="w-full max-w-xs" aria-label="Activity heatmap">
      {rows.map((label, row) =>
        row % 2 === 0 ? (
          <text key={row} x={padLeft - 4} y={row * step + cellSize - 1} textAnchor="end" fontSize="8" fill="#94a3b8">
            {label}
          </text>
        ) : null
      )}
      {data.map((week, col) =>
        week.map((intensity, row) => (
          <rect
            key={`${col}-${row}`}
            x={padLeft + col * step}
            y={row * step}
            width={cellSize}
            height={cellSize}
            rx="2"
            fill={heatColors[intensity]}
          />
        ))
      )}
    </svg>
  );
}

// ─── ACTIVITY BESTS ───────────────────────────────────────────────────────────

function ActivityBests({ bests }: { bests: BestPoint[] }) {
  if (bests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">No activities logged yet.</p>
    );
  }

  const maxCount = Math.max(...bests.map(b => b.count));

  return (
    <div className="space-y-4">
      {bests.map((b) => {
        const cfg = TYPE_CONFIG[b.type] ?? FALLBACK_TYPE;
        const Icon = cfg.Icon;
        const pct = Math.round((b.count / maxCount) * 100);
        const bestStr = b.bestValue != null
          ? `${b.bestValue % 1 === 0 ? b.bestValue : b.bestValue.toFixed(1)} ${b.bestUnit ?? ''}`.trim()
          : b.bestDuration != null
            ? `${b.bestDuration} min`
            : '—';

        return (
          <div key={b.type}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md" style={{ backgroundColor: cfg.color + '20' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                </div>
                <span className="text-sm font-medium text-foreground">{cfg.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {b.count} session{b.count !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-bold text-foreground">Best: {bestStr}</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: cfg.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`bg-card rounded-xl border border-border animate-pulse ${className}`} />;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    fetch(`/api/analytics?userId=${user.id}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Please log in to view your analytics.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-56 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <SkeletonCard className="h-56 lg:col-span-3" />
          <SkeletonCard className="h-56 lg:col-span-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <SkeletonCard className="h-56 lg:col-span-3" />
          <SkeletonCard className="h-56 lg:col-span-2" />
        </div>
        <SkeletonCard className="h-52" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Failed to load analytics. Please try refreshing.
      </div>
    );
  }

  const {
    totalWorkouts, totalMinutes, activitiesThisMonth,
    currentStreak, longestStreak, activeDays,
  } = data;

  const lastMonthMins = data.monthlyData.at(-2)?.minutes ?? 0;
  const thisMonthMins = data.monthlyData.at(-1)?.minutes ?? 0;
  const isMonthlyHigh = thisMonthMins > 0 && thisMonthMins === Math.max(...data.monthlyData.map(d => d.minutes));
  const monthlyChangePct = lastMonthMins > 0
    ? ((thisMonthMins - lastMonthMins) / lastMonthMins * 100).toFixed(1)
    : null;

  const lastWeekMins = data.weeklyData.at(-2)?.minutes ?? 0;
  const thisWeekMins = data.weeklyData.at(-1)?.minutes ?? 0;
  const weeklyChangePct = lastWeekMins > 0
    ? ((thisWeekMins - lastWeekMins) / lastWeekMins * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your fitness journey at a glance</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-foreground mt-1">{currentStreak} days</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Best: <span className="text-foreground font-medium">{longestStreak} days</span>
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalWorkouts}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Dumbbell className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <span className="text-green-500 font-medium">+{activitiesThisMonth} </span>this month
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Minutes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalMinutes.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/10 text-secondary">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {monthlyChangePct != null ? (
              <>
                <span className={`font-medium ${Number(monthlyChangePct) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Number(monthlyChangePct) >= 0 ? '+' : ''}{monthlyChangePct}%{' '}
                </span>
                vs last month
              </>
            ) : (
              <span className="text-foreground font-medium">{activeDays} active days</span>
            )}
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Days</p>
              <p className="text-2xl font-bold text-foreground mt-1">{activeDays}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <span className="text-green-500 font-medium">+{activitiesThisMonth} </span>this month
          </p>
        </div>
      </div>

      {/* Row 2: Weekly bar chart + Streak heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl shadow-sm p-5 border border-border lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Weekly Minutes</h2>
              <p className="text-xs text-muted-foreground">Active minutes per week</p>
            </div>
            {weeklyChangePct != null && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                Number(weeklyChangePct) >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
                {Number(weeklyChangePct) >= 0 ? '+' : ''}{weeklyChangePct}%
              </div>
            )}
          </div>
          <WeeklyMinutesChart data={data.weeklyData} />
        </div>

        <div className="bg-card rounded-xl shadow-sm p-5 border border-border lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Activity Streak</h2>
            <p className="text-xs text-muted-foreground">Last 12 weeks</p>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">current</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{longestStreak}</p>
              <p className="text-xs text-muted-foreground">longest</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{activeDays}</p>
              <p className="text-xs text-muted-foreground">active days</p>
            </div>
          </div>
          <HeatmapChart data={data.heatmap} />
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Less</span>
            {heatColors.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>

      {/* Row 3: Monthly line chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl shadow-sm p-5 border border-border lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Monthly Progress</h2>
              <p className="text-xs text-muted-foreground">Total active minutes per month</p>
            </div>
            {isMonthlyHigh && (
              <span className="text-xs text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded-md">
                All-time high ↑
              </span>
            )}
          </div>
          <MonthlyProgressChart data={data.monthlyData} />
        </div>

        <div className="bg-card rounded-xl shadow-sm p-5 border border-border lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Activity Mix</h2>
            <p className="text-xs text-muted-foreground">All time by type</p>
          </div>
          <DonutChart data={data.workoutMix} />
        </div>
      </div>

      {/* Activity Bests */}
      <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Activity Bests</h2>
            <p className="text-xs text-muted-foreground">Your top performance per activity type</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {data.bests.length} type{data.bests.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ActivityBests bests={data.bests} />
      </div>
    </div>
  );
}
