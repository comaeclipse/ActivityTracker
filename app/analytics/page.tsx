import { Flame, Clock, TrendingUp, Award, ChevronUp, Dumbbell } from 'lucide-react';

// ─── DEMO DATA ──────────────────────────────────────────────────────────────

const weeklyMinutes = [145, 210, 180, 260, 190, 300, 245, 320];
const weeklyLabels = ['Jan W1', 'Jan W2', 'Jan W3', 'Jan W4', 'Feb W1', 'Feb W2', 'Feb W3', 'Feb W4'];

const monthlyData = [
  { month: 'Sep', minutes: 720 },
  { month: 'Oct', minutes: 850 },
  { month: 'Nov', minutes: 780 },
  { month: 'Dec', minutes: 620 },
  { month: 'Jan', minutes: 995 },
  { month: 'Feb', minutes: 1055 },
];

const workoutTypes = [
  { type: 'Strength', count: 48, color: '#3b82f6' },
  { type: 'Running', count: 32, color: '#22c55e' },
  { type: 'Cycling', count: 18, color: '#a855f7' },
  { type: 'HIIT', count: 14, color: '#f59e0b' },
  { type: 'Other', count: 15, color: '#94a3b8' },
];

const personalRecords = [
  { exercise: 'Deadlift', current: 385, max: 500, unit: 'lbs', prev: 365 },
  { exercise: 'Squat', current: 315, max: 400, unit: 'lbs', prev: 295 },
  { exercise: 'Bench Press', current: 225, max: 300, unit: 'lbs', prev: 215 },
  { exercise: 'Overhead Press', current: 155, max: 200, unit: 'lbs', prev: 145 },
  { exercise: 'Pull-ups', current: 18, max: 25, unit: 'reps', prev: 15 },
];

// 12 weeks × 7 days (0=none, 1=light, 2=medium, 3=high)
const heatmap: number[][] = [
  [0, 2, 0, 1, 0, 3, 0],
  [1, 0, 2, 0, 2, 1, 0],
  [0, 3, 0, 2, 0, 2, 0],
  [2, 0, 1, 0, 1, 3, 0],
  [0, 1, 0, 3, 0, 2, 1],
  [3, 0, 2, 0, 2, 0, 0],
  [0, 2, 0, 1, 3, 2, 0],
  [1, 0, 3, 0, 2, 1, 0],
  [0, 2, 0, 2, 0, 3, 0],
  [2, 1, 0, 3, 0, 2, 0],
  [0, 3, 2, 0, 1, 2, 0],
  [3, 2, 2, 3, 2, 1, 1],
];
const heatColors = ['#f1f5f9', '#bfdbfe', '#60a5fa', '#2563eb'];

// ─── CHARTS ─────────────────────────────────────────────────────────────────

function WeeklyMinutesChart() {
  const maxVal = 340;
  const chartH = 120;
  const baseY = 142;
  const startX = 36;
  const slotW = 54;
  const barW = 32;
  const padX = (slotW - barW) / 2;

  return (
    <svg viewBox="0 0 480 175" className="w-full" aria-label="Weekly minutes bar chart">
      {/* Dashed grid lines */}
      {[85, 170, 255, 340].map((val) => {
        const y = baseY - (val / maxVal) * chartH;
        return (
          <g key={val}>
            <line x1={startX} y1={y} x2="472" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <text x={startX - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#94a3b8">{val}</text>
          </g>
        );
      })}
      {/* Baseline */}
      <line x1={startX} y1={baseY} x2="472" y2={baseY} stroke="#e2e8f0" strokeWidth="1" />
      {/* Bars */}
      {weeklyMinutes.map((val, i) => {
        const barH = (val / maxVal) * chartH;
        const rectX = startX + i * slotW + padX;
        const rectY = baseY - barH;
        const cx = rectX + barW / 2;
        const isHighest = val === Math.max(...weeklyMinutes);
        return (
          <g key={i}>
            <rect
              x={rectX} y={rectY} width={barW} height={barH} rx="4" ry="4"
              fill={isHighest ? '#1d4ed8' : '#3b82f6'}
              fillOpacity={0.75 + (i / weeklyMinutes.length) * 0.25}
            />
            {isHighest && (
              <text x={cx} y={rectY - 5} textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="600">
                {val}
              </text>
            )}
            <text x={cx} y={baseY + 13} textAnchor="middle" fontSize="8.5" fill="#64748b">
              {weeklyLabels[i].split(' ')[1]}
            </text>
            <text x={cx} y={baseY + 23} textAnchor="middle" fontSize="7.5" fill="#94a3b8">
              {weeklyLabels[i].split(' ')[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MonthlyProgressChart() {
  const maxVal = 1200;
  const chartH = 120;
  const padTop = 20;
  const padLeft = 40;
  const padRight = 15;
  const totalW = 500;
  const n = monthlyData.length;
  const xSpacing = (totalW - padLeft - padRight) / (n - 1);

  const getX = (i: number) => padLeft + i * xSpacing;
  const getY = (val: number) => padTop + chartH - (val / maxVal) * chartH;

  const pointsStr = monthlyData.map((d, i) => `${getX(i)},${getY(d.minutes)}`).join(' ');
  const areaD =
    `M ${getX(0)},${getY(monthlyData[0].minutes)} ` +
    monthlyData.slice(1).map((d, i) => `L ${getX(i + 1)},${getY(d.minutes)}`).join(' ') +
    ` L ${getX(n - 1)},${padTop + chartH} L ${getX(0)},${padTop + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${totalW} 175`} className="w-full" aria-label="Monthly minutes line chart">
      <defs>
        <linearGradient id="monthlyAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[300, 600, 900, 1200].map((val) => {
        const y = getY(val);
        return (
          <g key={val}>
            <line x1={padLeft} y1={y} x2={totalW - padRight} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <text x={padLeft - 5} y={y + 4} textAnchor="end" fontSize="8" fill="#94a3b8">{val}</text>
          </g>
        );
      })}
      {/* Baseline */}
      <line x1={padLeft} y1={padTop + chartH} x2={totalW - padRight} y2={padTop + chartH} stroke="#e2e8f0" strokeWidth="1" />
      {/* Area fill */}
      <path d={areaD} fill="url(#monthlyAreaGrad)" />
      {/* Line */}
      <polyline points={pointsStr} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots + labels */}
      {monthlyData.map((d, i) => (
        <g key={d.month}>
          <circle cx={getX(i)} cy={getY(d.minutes)} r="4.5" fill="#22c55e" stroke="white" strokeWidth="2" />
          <text x={getX(i)} y={padTop + chartH + 16} textAnchor="middle" fontSize="9.5" fill="#64748b">{d.month}</text>
          <text x={getX(i)} y={padTop + chartH + 27} textAnchor="middle" fontSize="8.5" fill="#94a3b8">{d.minutes}</text>
        </g>
      ))}
    </svg>
  );
}

function DonutChart() {
  const total = workoutTypes.reduce((s, d) => s + d.count, 0);
  const cx = 80, cy = 80, r = 58;
  const C = 2 * Math.PI * r;

  let cumulative = 0;
  const segments = workoutTypes.map((d) => {
    const len = (d.count / total) * C;
    const seg = { ...d, len, offset: cumulative };
    cumulative += len;
    return seg;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg viewBox="0 0 160 160" className="w-36 h-36 flex-shrink-0" aria-label="Workout type donut chart">
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
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">workouts</text>
      </svg>
      <div className="space-y-2.5 flex-1 w-full min-w-0">
        {workoutTypes.map((d) => {
          const pct = Math.round((d.count / total) * 100);
          return (
            <div key={d.type} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-foreground flex-1">{d.type}</span>
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden flex-shrink-0">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
              </div>
              <span className="text-xs text-muted-foreground w-7 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeatmapChart() {
  const cellSize = 13;
  const gap = 2;
  const step = cellSize + gap;
  const padLeft = 16;
  const rows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const width = padLeft + heatmap.length * step;
  const height = 7 * step - gap;

  return (
    <svg viewBox={`0 0 ${width + 4} ${height + 4}`} className="w-full max-w-xs" aria-label="Activity heatmap">
      {rows.map((label, row) => (
        row % 2 === 0 ? (
          <text key={row} x={padLeft - 4} y={row * step + cellSize - 1} textAnchor="end" fontSize="8" fill="#94a3b8">
            {label}
          </text>
        ) : null
      ))}
      {heatmap.map((week, col) =>
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

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const totalWorkouts = 127;
  const totalMinutes = 4820;
  const currentStreak = 14;
  const longestStreak = 21;
  const prsThisMonth = 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your fitness journey at a glance — demo data</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-foreground mt-1">{currentStreak} days</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 text-orange-500">
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
            <span className="text-green-500 font-medium">+8 </span>this month
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
            <span className="text-green-500 font-medium">+6.1% </span>vs last month
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">PRs This Month</p>
              <p className="text-2xl font-bold text-foreground mt-1">{prsThisMonth}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <span className="text-green-500 font-medium">+2 </span>vs last month
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
            <div className="flex items-center gap-1 text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              +30.6%
            </div>
          </div>
          <WeeklyMinutesChart />
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
              <p className="text-3xl font-bold text-foreground">68</p>
              <p className="text-xs text-muted-foreground">active days</p>
            </div>
          </div>
          <HeatmapChart />
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
            <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-md">All-time high ↑</span>
          </div>
          <MonthlyProgressChart />
        </div>

        <div className="bg-card rounded-xl shadow-sm p-5 border border-border lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Workout Mix</h2>
            <p className="text-xs text-muted-foreground">All time by type</p>
          </div>
          <DonutChart />
        </div>
      </div>

      {/* Personal Records */}
      <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Personal Records</h2>
            <p className="text-xs text-muted-foreground">Current best vs previous PR</p>
          </div>
          <span className="text-xs text-muted-foreground">{prsThisMonth} new this month</span>
        </div>
        <div className="space-y-4">
          {personalRecords.map((pr) => {
            const pct = Math.round((pr.current / pr.max) * 100);
            const prevPct = Math.round((pr.prev / pr.max) * 100);
            const improvement = pr.unit === 'lbs'
              ? `+${pr.current - pr.prev} ${pr.unit}`
              : `+${pr.current - pr.prev} ${pr.unit}`;
            return (
              <div key={pr.exercise}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{pr.exercise}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">{pr.prev} {pr.unit}</span>
                    <span className="text-sm font-bold text-foreground">{pr.current} {pr.unit}</span>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-green-500 bg-green-50 px-1.5 py-0.5 rounded">
                      <ChevronUp className="w-3 h-3" />
                      {improvement}
                    </span>
                  </div>
                </div>
                <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                  {/* Previous PR marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-primary/30 z-10"
                    style={{ left: `${prevPct}%` }}
                  />
                  {/* Current PR bar */}
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground">0</span>
                  <span className="text-xs text-muted-foreground">{pr.max} {pr.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
