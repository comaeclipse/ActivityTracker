"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import ActivityLogger from '@/components/ActivityLogger';
import WorkoutStreakCalendar from '@/components/WorkoutStreakCalendar';
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Welcome to FitLog</h2>
        <p className="text-muted-foreground">
          Log your workouts and keep your streak going. Log in or sign up to get started.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-95 transition-opacity"
          >
            Log in
          </Link>
          <Link
            href="/login?mode=signup"
            className="inline-block px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors"
          >
            Sign up
          </Link>
        </div>
        <SpeedInsights />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Universal workout logger */}
      <ActivityLogger />

      {/* Streak + month calendar */}
      <WorkoutStreakCalendar />

      <SpeedInsights />
    </div>
  );
}
