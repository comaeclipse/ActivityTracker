'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Heart, Droplets, Dumbbell, Bike, Waves } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type FeedItem = {
  id: string;
  user: { id: string; username: string };
  type: string;
  value: number | null;
  unit: string | null;
  durationMinutes: number | null;
  notes: string | null;
  activityDate: string;
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; iconColor: string; iconBg: string }> = {
  RUN:       { icon: TrendingUp, iconColor: 'text-primary',     iconBg: 'bg-primary/10'  },
  WALK:      { icon: TrendingUp, iconColor: 'text-blue-500',    iconBg: 'bg-blue-500/10' },
  SWIM:      { icon: Waves,      iconColor: 'text-cyan-500',    iconBg: 'bg-cyan-500/10' },
  WEIGHTS:   { icon: Dumbbell,   iconColor: 'text-purple-500',  iconBg: 'bg-purple-500/10' },
  BIKE:      { icon: Bike,       iconColor: 'text-green-500',   iconBg: 'bg-green-500/10' },
  HYDRATION: { icon: Droplets,   iconColor: 'text-sky-500',     iconBg: 'bg-sky-500/10' },
  ROW:       { icon: Waves,      iconColor: 'text-teal-500',    iconBg: 'bg-teal-500/10' },
};

const DEFAULT_CONFIG = { icon: Zap, iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/10' };

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatContent(type: string, value: number | null, unit: string | null): string {
  const val = value != null ? `${value} ${unit ?? ''}`.trim() : '';
  switch (type) {
    case 'RUN':       return val ? `ran ${val}` : 'went for a run';
    case 'WALK':      return val ? `walked ${val}` : 'went for a walk';
    case 'SWIM':      return val ? `swam ${val}` : 'went swimming';
    case 'WEIGHTS':   return 'did a weights workout';
    case 'BIKE':      return val ? `cycled ${val}` : 'went cycling';
    case 'HYDRATION': return val ? `logged ${val} of water` : 'logged hydration';
    case 'ROW':       return val ? `rowed ${val}` : 'went rowing';
    default:          return 'logged an activity';
  }
}

function formatDetails(durationMinutes: number | null, notes: string | null): string {
  const parts: string[] = [];
  if (durationMinutes) parts.push(`${durationMinutes} min`);
  if (notes) parts.push(notes);
  return parts.join(' • ');
}

export default function ActivityFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ take: '5' });
    if (user?.id) params.set('currentUserId', user.id);

    fetch(`/api/feed?${params}`)
      .then((r) => r.json())
      .then((json) => { setItems(json.data ?? []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Recent Activities</h2>
      </div>

      <div className="divide-y divide-border">
        {loading && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))
        )}

        {!loading && error && (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            Failed to load activities.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            No activities yet. Log your first one above!
          </p>
        )}

        {!loading && !error && items.map((a) => {
          const config = TYPE_CONFIG[a.type] ?? DEFAULT_CONFIG;
          const Icon = config.icon;
          const displayName = user && a.user.id === user.id ? 'You' : a.user.username;
          const details = formatDetails(a.durationMinutes, a.notes);

          return (
            <div
              key={a.id}
              className="transition-all duration-200 ease-in-out px-5 py-4 hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${config.iconBg} ${config.iconColor} mr-4 shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground truncate">
                      {displayName} {formatContent(a.type, a.value, a.unit)}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">{relativeTime(a.activityDate)}</span>
                  </div>
                  {details && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{details}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-border text-center">
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View all activities
        </button>
      </div>
    </div>
  );
}
