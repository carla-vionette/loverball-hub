import { supabase } from '@/integrations/supabase/client';
import type { Invite, LeaderboardEntry } from '@/types';

export async function getUserInvite(userId: string): Promise<Invite | null> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('inviter_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Invite | null;
}

export async function getInviteByCode(code: string): Promise<Invite | null> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('invite_code', code)
    .maybeSingle();
  if (error) throw error;
  return data as Invite | null;
}

export async function incrementInviteCount(inviteCode: string): Promise<void> {
  const invite = await getInviteByCode(inviteCode);
  if (!invite) return;
  const { error } = await supabase
    .from('invites')
    .update({ signup_count: invite.signup_count + 1 })
    .eq('id', invite.id);
  if (error) throw error;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('inviter_id, invite_code, signup_count')
    .gt('signup_count', 0)
    .order('signup_count', { ascending: false })
    .limit(10);
  if (error) throw error;

  const entries = (data || []) as LeaderboardEntry[];
  if (entries.length === 0) return [];

  // Fetch profile info
  const userIds = entries.map(e => e.inviter_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, profile_photo_url')
    .in('id', userIds);

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, { name: p.name, photo: p.profile_photo_url }])
  );

  return entries.map(e => ({
    ...e,
    inviter_name: profileMap.get(e.inviter_id)?.name || 'Unknown',
    inviter_photo: profileMap.get(e.inviter_id)?.photo || null,
  }));
}

export function getInviteLink(code: string): string {
  return `${window.location.origin}/invite/${code}`;
}

export function getInviteBadge(count: number): { label: string; emoji: string } | null {
  if (count >= 25) return { label: 'MVP', emoji: '🏆' };
  if (count >= 10) return { label: 'Team Captain', emoji: '⭐' };
  if (count >= 5) return { label: 'Rookie Recruiter', emoji: '🎯' };
  return null;
}
