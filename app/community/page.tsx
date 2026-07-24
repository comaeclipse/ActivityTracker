'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { parseLoggerNotes, groupSessions } from '@/lib/activity-notes';
import {
  Users, Heart, TrendingUp, Waves, Dumbbell, Bike, Droplets, Zap,
} from 'lucide-react';

type Activity = {
  id: string;
  user: { id: string; username: string };
  type: string;
  value: number | null;
  unit: string | null;
  durationMinutes: number | null;
  notes: string | null;
  activityDate: string;
  createdAt: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
};

const TYPE_CONFIG: Record<string, { label: string; Icon: React.ElementType; iconColor: string; iconBg: string }> = {
  RUN:       { label: 'Run',       Icon: TrendingUp, iconColor: 'text-blue-500',   iconBg: 'bg-blue-500/10'   },
  WALK:      { label: 'Walk',      Icon: TrendingUp, iconColor: 'text-green-500',  iconBg: 'bg-green-500/10'  },
  SWIM:      { label: 'Swim',      Icon: Waves,      iconColor: 'text-cyan-500',   iconBg: 'bg-cyan-500/10'   },
  WEIGHTS:   { label: 'Weights',   Icon: Dumbbell,   iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10' },
  BIKE:      { label: 'Cycling',   Icon: Bike,       iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10' },
  HYDRATION: { label: 'Hydration', Icon: Droplets,   iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
  ROW:       { label: 'Row',       Icon: Waves,      iconColor: 'text-teal-500',   iconBg: 'bg-teal-500/10'   },
};

const FALLBACK = { label: 'Activity', Icon: Zap, iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/10' };

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSummary(type: string, value: number | null, unit: string | null, duration: number | null): string {
  const parts: string[] = [];
  if (value != null && unit) parts.push(`${value % 1 === 0 ? value : value.toFixed(1)} ${unit}`);
  if (duration != null) parts.push(`${duration} min`);
  return parts.join(' · ');
}

// Per-exercise label for a line inside a grouped card, e.g. "strength: push".
function exerciseLabel(a: Activity): string {
  const parsed = parseLoggerNotes(a.notes);
  if (parsed) return `${parsed.category.toLowerCase()}: ${parsed.label.toLowerCase()}`;
  return (TYPE_CONFIG[a.type] ?? FALLBACK).label.toLowerCase();
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFeed = useCallback(() => {
    const params = new URLSearchParams({ take: '50' });
    if (user?.id) params.set('currentUserId', user.id);

    fetch(`/api/feed?${params}`)
      .then(r => r.json())
      .then(json => setActivities(json.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleLike = async (activityId: string) => {
    if (!user) return;

    // Optimistic update
    setActivities(prev => prev.map(a => {
      if (a.id !== activityId) return a;
      const liked = a.isLikedByCurrentUser;
      return { ...a, isLikedByCurrentUser: !liked, likeCount: liked ? a.likeCount - 1 : a.likeCount + 1 };
    }));

    const res = await fetch(`/api/activities/${activityId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    if (!res.ok) {
      // Revert on failure
      setActivities(prev => prev.map(a => {
        if (a.id !== activityId) return a;
        const liked = a.isLikedByCurrentUser;
        return { ...a, isLikedByCurrentUser: !liked, likeCount: liked ? a.likeCount - 1 : a.likeCount + 1 };
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground">Recent activity from all members</p>
        </div>
      </div>

      {/* Feed */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading && (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-muted shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="px-5 py-10 text-center text-muted-foreground">
            Failed to load community feed.
          </p>
        )}

        {!loading && !error && activities.length === 0 && (
          <p className="px-5 py-10 text-center text-muted-foreground">
            No activities yet — be the first to log one!
          </p>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="divide-y divide-border">
            {groupSessions(activities).map((group) => {
              // The anchor row carries the session's identity: its icon, its
              // shared note, and — since likes are stored per row — its likes.
              const anchor = group[0];
              const isSession = group.length > 1;
              const cfg = TYPE_CONFIG[anchor.type] ?? FALLBACK;
              const Icon = isSession ? Zap : cfg.Icon;
              const isOwn = user?.id === anchor.user.id;
              const summary = formatSummary(anchor.type, anchor.value, anchor.unit, anchor.durationMinutes);
              const parsed = parseLoggerNotes(anchor.notes);
              // Lowercased to sit inside the "logged a …" sentence.
              const activityLabel = parsed
                ? `${parsed.category.toLowerCase()}: ${parsed.label.toLowerCase()}`
                : cfg.label.toLowerCase();
              // Every row in a session repeats the same free-text note, so the
              // anchor's copy stands in for the whole group.
              const displayNotes = parsed ? parsed.extra : anchor.notes;

              return (
                <div key={anchor.id} className="px-5 py-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Activity type icon */}
                    <div className={`p-2 rounded-lg ${isSession ? 'bg-primary/10 text-primary' : `${cfg.iconBg} ${cfg.iconColor}`} shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Username + time */}
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <a
                            href={`/user/${anchor.user.username}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {isOwn ? 'You' : anchor.user.username}
                          </a>
                          <span className="text-sm text-muted-foreground">
                            {isSession
                              ? `logged a workout · ${group.length} exercises`
                              : `logged a ${activityLabel}${summary ? ` · ${summary}` : ''}`}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {relativeTime(anchor.activityDate)}
                        </span>
                      </div>

                      {/* Exercises in the session */}
                      {isSession && (
                        <ul className="mt-2 space-y-1">
                          {group.map((a) => {
                            const itemSummary = formatSummary(a.type, a.value, a.unit, a.durationMinutes);
                            return (
                              <li key={a.id} className="flex items-baseline gap-2 text-sm text-foreground">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                                <span>
                                  {exerciseLabel(a)}
                                  {itemSummary && (
                                    <span className="text-muted-foreground"> · {itemSummary}</span>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Notes */}
                      {displayNotes && (
                        <p className="text-sm text-muted-foreground mt-1.5 italic">
                          &ldquo;{displayNotes}&rdquo;
                        </p>
                      )}

                      {/* Like button */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          onClick={() => handleLike(anchor.id)}
                          disabled={!user}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${
                            anchor.isLikedByCurrentUser
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-muted-foreground hover:text-red-500'
                          } ${!user ? 'opacity-40 cursor-default' : ''}`}
                        >
                          <Heart className={`w-4 h-4 ${anchor.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                          {anchor.likeCount > 0 && (
                            <span>{anchor.likeCount}</span>
                          )}
                        </button>
                        {anchor.likeCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {anchor.likeCount === 1 ? 'like' : 'likes'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
