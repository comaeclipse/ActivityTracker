"use client";

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Flame, CalendarDays, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface FeedItem {
  type: string;
  activityDate: string;
}

function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocal(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function WorkoutStreakCalendar() {
  const { user } = useAuth();
  const [dayStrs, setDayStrs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const url = new URL('/api/feed', window.location.origin);
        url.searchParams.set('userId', user.id);
        url.searchParams.set('take', '1000');

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load activities');

        const items: FeedItem[] = data.data || [];
        const days = new Set<string>();
        for (const it of items) {
          if (it.type === 'HYDRATION') continue; // count workouts only
          days.add(fmtLocal(new Date(it.activityDate)));
        }
        if (!cancelled) setDayStrs([...days]);
      } catch {
        if (!cancelled) setDayStrs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const daySet = useMemo(() => new Set(dayStrs), [dayStrs]);
  const workoutDates = useMemo(() => dayStrs.map(parseLocal), [dayStrs]);

  // Consecutive days up to today (today not yet logged doesn't break it).
  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    if (!daySet.has(fmtLocal(d))) d.setDate(d.getDate() - 1);
    while (daySet.has(fmtLocal(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, [daySet]);

  const bestStreak = useMemo(() => {
    const sorted = [...daySet].sort();
    let best = 0;
    let cur = 0;
    let prev: Date | null = null;
    for (const s of sorted) {
      const d = parseLocal(s);
      if (prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1) cur++;
      else cur = 1;
      best = Math.max(best, cur);
      prev = d;
    }
    return best;
  }, [daySet]);

  // Workout days within the month currently shown in the calendar.
  const monthCount = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    let n = 0;
    for (const s of daySet) {
      const d = parseLocal(s);
      if (d.getFullYear() === y && d.getMonth() === m) n++;
    }
    return n;
  }, [daySet, month]);

  if (!user) return null;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Your Workouts</h2>
      </div>

      {/* Streak stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <Stat icon={<Flame className="w-4 h-4" />} label="Current streak" value={`${currentStreak}d`} accent="text-orange-500" />
        <Stat icon={<CalendarDays className="w-4 h-4" />} label="This month" value={`${monthCount}`} accent="text-blue-500" />
        <Stat icon={<Trophy className="w-4 h-4" />} label="Best streak" value={`${bestStreak}d`} accent="text-yellow-500" />
      </div>

      {/* Month calendar */}
      <div className="flex justify-center py-2">
        {loading ? (
          <div className="py-16 text-sm text-muted-foreground">Loading calendar…</div>
        ) : (
          <Calendar
            month={month}
            onMonthChange={setMonth}
            modifiers={{ workout: workoutDates }}
            modifiersClassNames={{
              workout: '!bg-blue-500 !text-white rounded-full hover:!bg-blue-600 focus:!bg-blue-600',
            }}
          />
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="p-4 text-center">
      <div className={`flex items-center justify-center gap-1.5 ${accent}`}>
        {icon}
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
