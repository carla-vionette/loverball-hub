import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalMembers: number;
  totalVideos: number;
  totalEvents: number;
  activeSubscriptions: number;
  recentSignups: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [members, videos, events, subscriptions, recentProfiles] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').neq('plan', 'free'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    totalMembers: members.count || 0,
    totalVideos: videos.count || 0,
    totalEvents: events.count || 0,
    activeSubscriptions: subscriptions.count || 0,
    recentSignups: recentProfiles.count || 0,
  };
}

export interface SignupDataPoint {
  date: string;
  count: number;
}

export async function fetchSignupTrend(days: number = 30): Promise<SignupDataPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by date
  const counts = new Map<string, number>();
  (data || []).forEach(row => {
    const date = new Date(row.created_at).toISOString().split('T')[0];
    counts.set(date, (counts.get(date) || 0) + 1);
  });

  // Fill in all days
  const result: SignupDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    result.push({ date: key, count: counts.get(key) || 0 });
  }
  return result;
}

export interface PlanDistribution {
  plan: string;
  count: number;
}

export async function fetchPlanDistribution(): Promise<PlanDistribution[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('status', 'active');

  if (error) throw error;

  const counts = new Map<string, number>();
  (data || []).forEach(row => {
    counts.set(row.plan, (counts.get(row.plan) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([plan, count]) => ({ plan, count }));
}
