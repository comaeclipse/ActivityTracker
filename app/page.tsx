import ActivityFeed from '@/components/ActivityFeed';
import StatsCards from '@/components/StatsCards';
import ActivityLogger from '@/components/ActivityLogger';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Activity Logger */}
      <ActivityLogger />

      {/* Stats Cards */}
      <StatsCards />

      {/* Recent Activities */}
      <ActivityFeed />
    </div>
  );
}
