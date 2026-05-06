import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function toDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function startOfUTCDay(d: Date): Date {
  const r = new Date(d);
  r.setUTCHours(0, 0, 0, 0);
  return r;
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const activities = await prisma.activity.findMany({
      where: { userId },
      select: { type: true, value: true, unit: true, durationMinutes: true, activityDate: true },
      orderBy: { activityDate: 'asc' },
    });

    const now = new Date();
    const today = startOfUTCDay(now);

    // ── Basic stats ────────────────────────────────────────────────────────────
    const totalWorkouts = activities.length;
    const totalMinutes = activities.reduce((s, a) => s + (a.durationMinutes ?? 0), 0);

    const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const activitiesThisMonth = activities.filter(a => a.activityDate >= thisMonthStart).length;

    // ── Streaks ────────────────────────────────────────────────────────────────
    const activityDays = new Set(activities.map(a => toDateKey(a.activityDate)));
    const activeDays = activityDays.size;

    // Current streak: count back from today (or yesterday if today has no activity)
    let currentStreak = 0;
    const cursor = new Date(today);
    if (!activityDays.has(toDateKey(cursor))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (activityDays.has(toDateKey(cursor))) {
      currentStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    // Longest streak
    let longestStreak = 0;
    let run = 0;
    let prevKey = '';
    for (const key of [...activityDays].sort()) {
      if (prevKey) {
        const diff = (new Date(key).getTime() - new Date(prevKey).getTime()) / 86400000;
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prevKey = key;
    }

    // ── Weekly data (last 8 weeks, oldest→newest) ──────────────────────────────
    const dayOfWeek = (today.getUTCDay() + 6) % 7; // 0=Mon, 6=Sun
    const currentWeekStart = new Date(today);
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - dayOfWeek);

    const weeklyData: { label: string; minutes: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

      const mins = activities
        .filter(a => a.activityDate >= weekStart && a.activityDate < weekEnd)
        .reduce((s, a) => s + (a.durationMinutes ?? 0), 0);

      const mo = weekStart.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
      const wn = Math.ceil(weekStart.getUTCDate() / 7);
      weeklyData.push({ label: `${mo} W${wn}`, minutes: mins });
    }

    // ── Monthly data (last 6 months, oldest→newest) ────────────────────────────
    const monthlyData: { month: string; minutes: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m, 1));
      const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m + 1, 1));

      const mins = activities
        .filter(a => a.activityDate >= monthStart && a.activityDate < monthEnd)
        .reduce((s, a) => s + (a.durationMinutes ?? 0), 0);

      const mo = monthStart.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
      monthlyData.push({ month: mo, minutes: mins });
    }

    // ── Workout mix ────────────────────────────────────────────────────────────
    const typeCounts: Record<string, number> = {};
    for (const a of activities) {
      typeCounts[a.type] = (typeCounts[a.type] ?? 0) + 1;
    }
    const workoutMix = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // ── Heatmap (12 cols×7 rows, col=week oldest→newest, row=Mon→Sun) ──────────
    const heatmapStart = new Date(currentWeekStart);
    heatmapStart.setUTCDate(heatmapStart.getUTCDate() - 11 * 7);

    const dateCounts: Record<string, number> = {};
    for (const a of activities) {
      const k = toDateKey(a.activityDate);
      dateCounts[k] = (dateCounts[k] ?? 0) + 1;
    }

    const heatmap: number[][] = [];
    for (let col = 0; col < 12; col++) {
      const week: number[] = [];
      for (let row = 0; row < 7; row++) {
        const d = new Date(heatmapStart);
        d.setUTCDate(d.getUTCDate() + col * 7 + row);
        if (d > today) {
          week.push(0);
        } else {
          const count = dateCounts[toDateKey(d)] ?? 0;
          week.push(count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3);
        }
      }
      heatmap.push(week);
    }

    // ── Bests per activity type ────────────────────────────────────────────────
    const bestsByType: Record<string, {
      count: number;
      totalMinutes: number;
      bestValue: number | null;
      bestUnit: string | null;
      bestDuration: number | null;
    }> = {};

    for (const a of activities) {
      if (!bestsByType[a.type]) {
        bestsByType[a.type] = { count: 0, totalMinutes: 0, bestValue: null, bestUnit: null, bestDuration: null };
      }
      const b = bestsByType[a.type];
      b.count++;
      b.totalMinutes += a.durationMinutes ?? 0;
      if (a.value != null && (b.bestValue == null || a.value > b.bestValue)) {
        b.bestValue = a.value;
        b.bestUnit = a.unit;
      }
      if (a.durationMinutes != null && (b.bestDuration == null || a.durationMinutes > b.bestDuration)) {
        b.bestDuration = a.durationMinutes;
      }
    }

    const bests = Object.entries(bestsByType)
      .map(([type, stats]) => ({ type, ...stats }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalWorkouts,
      totalMinutes,
      activitiesThisMonth,
      currentStreak,
      longestStreak,
      activeDays,
      weeklyData,
      monthlyData,
      workoutMix,
      heatmap,
      bests,
    });
  } catch (err: unknown) {
    console.error('GET /api/analytics error', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
