import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogEntry {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export async function logAdminAction(
  action_type: string,
  target_type: string,
  target_id?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await (supabase as any).from('admin_activity_log').insert({
    admin_id: user.id,
    action_type,
    target_type,
    target_id: target_id || null,
    details: details || {},
  });
}

export async function fetchActivityLog(limit = 50): Promise<ActivityLogEntry[]> {
  const { data, error } = await (supabase as any)
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as ActivityLogEntry[];
}
