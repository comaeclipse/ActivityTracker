'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
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
            {activities.map((a) => {
              const cfg = TYPE_CONFIG[a.type] ?? FALLBACK;
              const Icon = cfg.Icon;
              const isOwn = user?.id === a.user.id;
              const summary = formatSummary(a.type, a.value, a.unit, a.durationMinutes);

              return (
                <div key={a.id} className="px-5 py-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Activity type icon */}
                    <div className={`p-2 rounded-lg ${cfg.iconBg} ${cfg.iconColor} shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Username + time */}
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <a
                            href={`/user/${a.user.username}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {isOwn ? 'You' : a.user.username}
                          </a>
                          <span className="text-sm text-muted-foreground">
                            logged a {cfg.label.toLowerCase()}
                            {summary ? ` · ${summary}` : ''}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {relativeTime(a.activityDate)}
                        </span>
                      </div>

                      {/* Notes */}
                      {a.notes && (
                        <p className="text-sm text-muted-foreground mt-1.5 italic">
                          &ldquo;{a.notes}&rdquo;
                        </p>
                      )}

                      {/* Like button */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          onClick={() => handleLike(a.id)}
                          disabled={!user}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${
                            a.isLikedByCurrentUser
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-muted-foreground hover:text-red-500'
                          } ${!user ? 'opacity-40 cursor-default' : ''}`}
                        >
                          <Heart className={`w-4 h-4 ${a.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                          {a.likeCount > 0 && (
                            <span>{a.likeCount}</span>
                          )}
                        </button>
                        {a.likeCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {a.likeCount === 1 ? 'like' : 'likes'}
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
