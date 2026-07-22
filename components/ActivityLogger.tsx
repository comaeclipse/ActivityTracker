"use client";

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, X, Dumbbell, Activity as ActivityIcon, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type WType = 'RUN' | 'WALK' | 'BIKE' | 'ROW' | 'WEIGHTS';

interface SubItem {
  label: string;
  type: WType;
}

interface Group {
  category: string;
  icon: (props: { className?: string }) => ReactNode;
  items: SubItem[];
}

// One universal logger. Every category resolves to a concrete activity type,
// but the user just picks what they did — no separate "log strength" flows.
const GROUPS: Group[] = [
  {
    category: 'Strength',
    icon: Dumbbell,
    items: ['Push', 'Pull', 'Legs', 'Core', 'Full Body'].map((label) => ({
      label,
      type: 'WEIGHTS' as WType,
    })),
  },
  {
    category: 'Cardio',
    icon: ActivityIcon,
    items: [
      { label: 'Run', type: 'RUN' },
      { label: 'Walk', type: 'WALK' },
      { label: 'Bike', type: 'BIKE' },
      { label: 'Row', type: 'ROW' },
    ],
  },
  {
    category: 'Calisthenics',
    icon: Zap,
    items: ['Push-ups', 'Pull-ups', 'Yoga', 'Squats', 'Core'].map((label) => ({
      label,
      type: 'WEIGHTS' as WType,
    })),
  },
];

interface Segment {
  category: string;
  label: string;
  type: WType;
}

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function ActivityLogger() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Segment[]>([]);
  const [activityDate, setActivityDate] = useState(nowLocal);
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const reset = () => {
    setOpen(false);
    setSelected([]);
    setDistance('');
    setNotes('');
    setMessage(null);
    setActivityDate(nowLocal());
  };

  const isSelected = (c: string, l: string) =>
    selected.some((s) => s.category === c && s.label === l);

  const toggle = (seg: Segment) =>
    setSelected((prev) =>
      prev.some((s) => s.category === seg.category && s.label === seg.label)
        ? prev.filter((s) => !(s.category === seg.category && s.label === seg.label))
        : [...prev, seg]
    );

  const remove = (c: string, l: string) =>
    setSelected((prev) => prev.filter((s) => !(s.category === c && s.label === l)));

  const hasDistance = selected.some((s) => s.type === 'RUN' || s.type === 'WALK');

  const submit = async () => {
    if (!selected.length) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const iso = new Date(activityDate).toISOString();
      const dist = distance && Number(distance) > 0 ? Number(distance) : null;

      // One activity per selected segment, sharing the same date/notes.
      const bodies = selected.map((seg) => {
        const body: Record<string, unknown> = {
          userId: user.id,
          type: seg.type,
          activityDate: iso,
          notes: `${seg.category} · ${seg.label}${notes ? ` · ${notes}` : ''}`,
        };
        if (dist && (seg.type === 'RUN' || seg.type === 'WALK')) {
          body.value = dist;
          body.unit = 'miles';
        }
        return body;
      });

      await Promise.all(
        bodies.map(async (b) => {
          const res = await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(b),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.error || 'Failed to log activity');
          }
        })
      );

      setMessage({
        type: 'success',
        text: `Logged ${bodies.length} activit${bodies.length === 1 ? 'y' : 'ies'}!`,
      });
      setTimeout(() => {
        reset();
        window.location.reload();
      }, 800);
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to log activity',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="lg" className="w-full gap-2">
        <Plus className="w-5 h-5" />
        Log workout
      </Button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Log workout</h3>
        <button
          onClick={reset}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date &amp; time</label>
        <Input
          type="datetime-local"
          value={activityDate}
          onChange={(e) => setActivityDate(e.target.value)}
        />
      </div>

      {/* Category groups */}
      <div className="space-y-4">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.category}>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Icon className="w-3.5 h-3.5" />
                {group.category}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const active = isSelected(group.category, item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        toggle({ category: group.category, label: item.label, type: item.type })
                      }
                      aria-pressed={active}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Distance (only when a distance-based cardio type is picked) */}
      {hasDistance && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Distance (miles, optional)
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="3.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes (optional)</label>
        <textarea
          rows={2}
          placeholder="How did it feel?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Logging:</span>
          {selected.length === 0 ? (
            <span className="text-sm text-muted-foreground">pick one or more activities above</span>
          ) : (
            selected.map((seg) => (
              <Badge
                key={`${seg.category}:${seg.label}`}
                variant="secondary"
                className="gap-1 pl-2.5 pr-1 py-1"
              >
                <span className="text-muted-foreground">{seg.category}</span>
                <span aria-hidden>→</span>
                <span>{seg.label}</span>
                <button
                  type="button"
                  onClick={() => remove(seg.category, seg.label)}
                  className="ml-0.5 rounded-full hover:bg-background/60 p-0.5"
                  aria-label={`Remove ${seg.category} ${seg.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      {message && (
        <p
          className={`text-sm font-medium ${
            message.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Submit */}
      <Button onClick={submit} disabled={isSubmitting || selected.length === 0} className="w-full">
        {isSubmitting
          ? 'Logging…'
          : selected.length
          ? `Submit — log ${selected.length} activit${selected.length === 1 ? 'y' : 'ies'}`
          : 'Submit'}
      </Button>
    </div>
  );
}
