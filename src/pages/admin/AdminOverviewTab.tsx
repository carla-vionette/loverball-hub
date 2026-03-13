import { useState, useEffect } from 'react';
import KpiCard from '@/components/admin/KpiCard';
import { Users, Video, Calendar, CreditCard, UserPlus, TrendingUp } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { fetchDashboardStats, type DashboardStats } from '@/services/analyticsService';

const AdminOverviewTab = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <section>
      <h2 className="font-display text-xl font-bold uppercase mb-6">Platform Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard label="Total Members" value={stats.totalMembers} icon={Users} />
        <KpiCard label="Total Videos" value={stats.totalVideos} icon={Video} />
        <KpiCard label="Total Events" value={stats.totalEvents} icon={Calendar} />
        <KpiCard label="Paid Subs" value={stats.activeSubscriptions} icon={CreditCard} />
        <KpiCard
          label="New (7d)"
          value={stats.recentSignups}
          icon={UserPlus}
          trend={stats.recentSignups > 0 ? { direction: 'up', text: `+${stats.recentSignups} this week` } : undefined}
        />
      </div>
    </section>
  );
};

export default AdminOverviewTab;
