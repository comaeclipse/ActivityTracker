import ActivityFeed from '@/components/ActivityFeed';
import StatsCards from '@/components/StatsCards';
import ActivityLogger from '@/components/ActivityLogger';
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Activity Logger */}
      <ActivityLogger />

      {/* Stats Cards */}
      <StatsCards />

      {/* Recent Activities */}
      <ActivityFeed />

      <SpeedInsights />
    </div>
  );
}
