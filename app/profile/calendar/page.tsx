"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import WorkoutCalendar from '@/components/WorkoutCalendar';
import { Activity } from 'lucide-react';

export default function CalendarPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Workout Calendar</h2>
        <p className="text-muted-foreground mt-2">
          Track your workout consistency and see your progress over time
        </p>
      </div>
      <WorkoutCalendar />
    </div>
  );
}
