"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { Activity, Calendar } from 'lucide-react';

type ActivityType = 'RUN' | 'WALK' | 'SWIM' | 'WEIGHTS' | 'BIKE' | 'HYDRATION';

interface ActivityOption {
  value: ActivityType;
  label: string;
  defaultUnit: string;
  valueLabel: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: 'RUN', label: 'Run', defaultUnit: 'miles', valueLabel: 'Distance' },
  { value: 'WALK', label: 'Walk', defaultUnit: 'miles', valueLabel: 'Distance' },
  { value: 'SWIM', label: 'Swim', defaultUnit: 'laps', valueLabel: 'Laps' },
  { value: 'WEIGHTS', label: 'Lift Weights', defaultUnit: 'lbs', valueLabel: 'Weight' },
  { value: 'BIKE', label: 'Stationary Bike', defaultUnit: 'minutes', valueLabel: 'Duration' },
  { value: 'HYDRATION', label: 'Hydration', defaultUnit: 'oz', valueLabel: 'Amount' },
];

export default function ActivityLogger() {
  const { user } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<ActivityOption>(ACTIVITY_OPTIONS[0]);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(ACTIVITY_OPTIONS[0].defaultUnit);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [activityDate, setActivityDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleActivityChange = (activityValue: ActivityType) => {
    const activity = ACTIVITY_OPTIONS.find(opt => opt.value === activityValue)!;
    setSelectedActivity(activity);
    setUnit(activity.defaultUnit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to log activities' });
      return;
    }

    // Validate that at least one of value or durationMinutes is provided
    const hasValue = value && value.trim() !== '';
    const hasDuration = durationMinutes && durationMinutes.trim() !== '';

    if (!hasValue && !hasDuration) {
      setMessage({ type: 'error', text: 'Please enter either distance/amount or duration' });
      return;
    }

    if (hasValue && isNaN(Number(value))) {
      setMessage({ type: 'error', text: 'Please enter a valid number for distance/amount' });
      return;
    }

    if (hasDuration && (isNaN(Number(durationMinutes)) || Number(durationMinutes) <= 0)) {
      setMessage({ type: 'error', text: 'Please enter a valid duration (positive number)' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload: any = {
        userId: user.id,
        type: selectedActivity.value,
        notes: notes || undefined,
        activityDate: new Date(activityDate).toISOString(),
      };

      if (hasValue) {
        payload.value = Number(value);
        payload.unit = unit;
      }

      if (hasDuration) {
        payload.durationMinutes = Number(durationMinutes);
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log activity');
      }

      setMessage({ type: 'success', text: 'Activity logged successfully!' });
      setValue('');
      setDurationMinutes('');
      setNotes('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setActivityDate(now.toISOString().slice(0, 16));

      // Optionally refresh the page or activity feed
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to log activity' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Log Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type Selector */}
          <div>
            <label htmlFor="activity-type" className="block text-sm font-medium mb-2">
              What did you do?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACTIVITY_OPTIONS.map((activity) => (
                <button
                  key={activity.value}
                  type="button"
                  onClick={() => handleActivityChange(activity.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                    selectedActivity.value === activity.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent border-input hover:bg-muted/40'
                  }`}
                >
                  {activity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Value and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="value" className="block text-sm font-medium mb-2">
                {selectedActivity.valueLabel}
              </label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium mb-2">
                Unit
              </label>
              <Input
                id="unit"
                type="text"
                placeholder="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium mb-2">
              Duration (minutes)
            </label>
            <Input
              id="duration"
              type="number"
              step="1"
              min="1"
              placeholder="0"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter distance/amount, duration, or both
            </p>
          </div>

          {/* Activity Date/Time */}
          <div>
            <label htmlFor="activity-date" className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              When did you do this?
            </label>
            <Input
              id="activity-date"
              type="datetime-local"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={2}
              placeholder="How did it feel? Any thoughts?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging...' : 'Log Activity'}
          </Button>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
