import { Activity, Clock, Zap, Award } from 'lucide-react';

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
            <p className="text-2xl font-bold text-foreground mt-1">47</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <span className="text-green-500 font-medium">+12.5%</span> from last week
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Minutes</p>
            <p className="text-2xl font-bold text-foreground mt-1">286</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/10 text-secondary">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <span className="text-green-500 font-medium">+8.2%</span> from last week
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Calories Burned</p>
            <p className="text-2xl font-bold text-foreground mt-1">3,852</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <span className="text-green-500 font-medium">+6.7%</span> from last week
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold text-foreground mt-1">9 days</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <span className="text-red-500 font-medium">-1 day</span> from last week
        </p>
      </div>
    </div>
  );
}
