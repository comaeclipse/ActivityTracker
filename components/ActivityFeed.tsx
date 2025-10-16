import { TrendingUp, Clock, Award, Zap, Heart } from 'lucide-react';

type Activity = {
  id: string;
  user: string;
  content: string;
  time: string;
  details: string;
  icon: 'trending' | 'clock' | 'award' | 'zap' | 'heart';
  iconColor: string;
  iconBg: string;
};

const MOCK: Activity[] = [
  {
    id: '1',
    user: 'Sarah Johnson',
    content: 'ran 5 miles',
    time: '2h ago',
    details: 'Completed in 42 minutes • 580 calories burned',
    icon: 'trending',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10'
  },
  {
    id: '2',
    user: 'Mike Smith',
    content: 'played racquetball',
    time: '4h ago',
    details: '45 minutes • 420 calories burned',
    icon: 'clock',
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10'
  },
  {
    id: '3',
    user: 'You',
    content: 'completed a new personal record!',
    time: '6h ago',
    details: 'Ran 10K in 48 minutes 32 seconds',
    icon: 'award',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100'
  },
  {
    id: '4',
    user: 'Lisa Chen',
    content: 'did HIIT Workout',
    time: '8h ago',
    details: '30 minutes • 350 calories burned',
    icon: 'zap',
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-100'
  },
  {
    id: '5',
    user: 'David Wilson',
    content: 'cycled 15 miles',
    time: 'Yesterday',
    details: '55 minutes • 720 calories burned',
    icon: 'heart',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100'
  },
];

const iconMap = {
  trending: TrendingUp,
  clock: Clock,
  award: Award,
  zap: Zap,
  heart: Heart,
};

export default function ActivityFeed() {
  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Recent Activities</h2>
      </div>
      <div className="divide-y divide-border">
        {MOCK.map((a) => {
          const Icon = iconMap[a.icon];
          return (
            <div
              key={a.id}
              className="transition-all duration-200 ease-in-out px-5 py-4 hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${a.iconBg} ${a.iconColor} mr-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">
                      {a.user} {a.content}
                    </p>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{a.details}</p>
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
