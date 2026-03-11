import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalMembers: number;
  totalVideos: number;
  totalEvents: number;
  activeSubscriptions: number;
  newSignups7d: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [members, videos, events, activeSubs, recentSignups] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('videos').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').neq('plan', 'free'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  return {
    totalMembers: members.count || 0,
    totalVideos: videos.count || 0,
    totalEvents: events.count || 0,
    activeSubscriptions: activeSubs.count || 0,
    newSignups7d: recentSignups.count || 0,
  };
}

export interface SignupDataPoint {
  date: string;
  count: number;
}

export async function fetchSignupsOverTime(days: number = 30): Promise<SignupDataPoint[]> {
  const startDate = new Date(Date.now() - days * 86400000);
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by date
  const grouped: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    grouped[d.toISOString().split('T')[0]] = 0;
  }
  (data || []).forEach((row) => {
    const date = new Date(row.created_at).toISOString().split('T')[0];
    if (grouped[date] !== undefined) grouped[date]++;
  });

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

export interface PlanDistribution {
  plan: string;
  count: number;
}

export async function fetchPlanDistribution(): Promise<PlanDistribution[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan');
  if (error) throw error;

  const counts: Record<string, number> = { free: 0, pro: 0, premium: 0 };
  (data || []).forEach((row) => {
    const plan = (row as { plan: string }).plan || 'free';
    counts[plan] = (counts[plan] || 0) + 1;
  });

  return Object.entries(counts).map(([plan, count]) => ({ plan, count }));
}
