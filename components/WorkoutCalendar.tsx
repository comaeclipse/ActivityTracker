"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bike, Dumbbell, PersonStanding, Droplet } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Activity {
  id: string;
  type: 'RUN' | 'WALK' | 'SWIM' | 'WEIGHTS' | 'BIKE' | 'HYDRATION';
  activityDate: string;
  value: number | null;
  unit: string | null;
  durationMinutes: number | null;
}

interface WorkoutDay {
  date: string;
  activities: Activity[];
  count: number;
}

const WORKOUT_TYPES = ['RUN', 'WALK', 'SWIM', 'WEIGHTS', 'BIKE'];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const activityIcons = {
  RUN: PersonStanding,
  WALK: PersonStanding,
  SWIM: Droplet,
  WEIGHTS: Dumbbell,
  BIKE: Bike,
  HYDRATION: Droplet,
};

const activityLabels = {
  RUN: 'Run',
  WALK: 'Walk',
  SWIM: 'Swim',
  WEIGHTS: 'Weights',
  BIKE: 'Bike',
  HYDRATION: 'Hydration',
};

const activityColors = {
  RUN: 'text-blue-500 bg-blue-500/10',
  WALK: 'text-green-500 bg-green-500/10',
  SWIM: 'text-cyan-500 bg-cyan-500/10',
  WEIGHTS: 'text-orange-500 bg-orange-500/10',
  BIKE: 'text-purple-500 bg-purple-500/10',
  HYDRATION: 'text-indigo-500 bg-indigo-500/10',
};

export default function WorkoutCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workoutDays, setWorkoutDays] = useState<Map<string, WorkoutDay>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function fetchActivities() {
      if (!user) return;

      try {
        setIsLoading(true);

        // Get first and last day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const url = new URL('/api/feed', window.location.origin);
        url.searchParams.set('userId', user.id);
        url.searchParams.set('take', '1000'); // Get all activities for the month

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch activities');
        }

        const activities: Activity[] = data.data || [];

        // Filter for current month and workout types only
        const monthActivities = activities.filter(activity => {
          const activityDate = new Date(activity.activityDate);
          return (
            activityDate >= firstDay &&
            activityDate <= lastDay &&
            WORKOUT_TYPES.includes(activity.type)
          );
        });

        // Group activities by date
        const dayMap = new Map<string, WorkoutDay>();
        monthActivities.forEach(activity => {
          const dateStr = new Date(activity.activityDate).toISOString().split('T')[0];

          if (dayMap.has(dateStr)) {
            const existing = dayMap.get(dateStr)!;
            existing.activities.push(activity);
            existing.count++;
          } else {
            dayMap.set(dateStr, {
              date: dateStr,
              activities: [activity],
              count: 1
            });
          }
        });

        setWorkoutDays(dayMap);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [user, year, month]);

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const hasWorkout = (day: number | null) => {
    if (!day) return false;
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return workoutDays.has(dateStr);
  };

  const getWorkoutCount = (day: number | null) => {
    if (!day) return 0;
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return workoutDays.get(dateStr)?.count || 0;
  };

  const getActivitiesForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return workoutDays.get(dateStr)?.activities || [];
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const handleDayClick = (day: number | null) => {
    if (!day || !hasWorkout(day)) return;

    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    setExpandedDate(expandedDate === dateStr ? null : dateStr);
  };

  const getDayRows = () => {
    const allDays = getDaysInMonth();
    const rows: (number | null)[][] = [];

    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }

    return rows;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setExpandedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setExpandedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setExpandedDate(null);
  };

  const rows = getDayRows();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Workout Calendar
          </CardTitle>
          <Button
            onClick={goToToday}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button
            onClick={goToPreviousMonth}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {MONTHS[month]} {year}
          </h3>
          <Button
            onClick={goToNextMonth}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading calendar...
          </div>
        ) : (
          <div className="space-y-2">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="space-y-1">
              {rows.map((row, rowIndex) => {
                // Check if any day in this row is expanded
                const expandedDayInRow = row.find(day => {
                  if (!day) return false;
                  const dateStr = new Date(year, month, day).toISOString().split('T')[0];
                  return expandedDate === dateStr;
                });

                return (
                  <div key={rowIndex}>
                    {/* Day cells for this row */}
                    <div className="grid grid-cols-7 gap-1">
                      {row.map((day, dayIndex) => {
                        const hasActivity = hasWorkout(day);
                        const count = getWorkoutCount(day);
                        const today = isToday(day);
                        const dateStr = day ? new Date(year, month, day).toISOString().split('T')[0] : '';
                        const isExpanded = expandedDate === dateStr;

                        return (
                          <div
                            key={dayIndex}
                            onClick={() => handleDayClick(day)}
                            className={`
                              relative aspect-square flex flex-col items-center justify-center
                              rounded-lg border transition-all
                              ${day === null ? 'bg-transparent border-transparent' : ''}
                              ${today ? 'border-primary border-2' : 'border-border'}
                              ${isExpanded ? 'bg-green-500/40 border-green-500' : hasActivity ? 'bg-green-500/20 hover:bg-green-500/30' : 'bg-card hover:bg-muted/50'}
                              ${day !== null && hasActivity ? 'cursor-pointer' : day !== null ? 'cursor-default' : ''}
                            `}
                            title={day && hasActivity ? `${count} workout${count > 1 ? 's' : ''} - Click to ${isExpanded ? 'collapse' : 'expand'}` : ''}
                          >
                            {day !== null && (
                              <>
                                <span className={`text-sm font-medium ${today ? 'text-primary' : hasActivity ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {day}
                                </span>
                                {hasActivity && (
                                  <div className="absolute bottom-1 flex gap-0.5">
                                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                                      <div
                                        key={i}
                                        className="w-1 h-1 rounded-full bg-green-600"
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Expanded workout details */}
                    {expandedDayInRow && (
                      <div className="mt-2 mb-2 p-4 bg-muted/50 rounded-lg border border-border animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-foreground">
                              {MONTHS[month]} {expandedDayInRow}, {year}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {getWorkoutCount(expandedDayInRow)} workout{getWorkoutCount(expandedDayInRow) > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {getActivitiesForDay(expandedDayInRow).map(activity => {
                              const Icon = activityIcons[activity.type];
                              const colorClass = activityColors[activity.type];
                              const label = activityLabels[activity.type];

                              return (
                                <div
                                  key={activity.id}
                                  className="flex items-center gap-3 p-2 rounded-md bg-card border border-border"
                                >
                                  <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                      {label}
                                      {activity.value !== null && activity.unit !== null && `: ${activity.value} ${activity.unit}`}
                                      {activity.value !== null && activity.unit !== null && activity.durationMinutes !== null && ' • '}
                                      {activity.durationMinutes !== null && `${activity.durationMinutes} min`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(activity.activityDate).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-primary" />
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500/20 border border-border" />
                  <span>Workout day (click to expand)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-green-600" />
                    <div className="w-1 h-1 rounded-full bg-green-600" />
                    <div className="w-1 h-1 rounded-full bg-green-600" />
                  </div>
                  <span>Activity count</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
