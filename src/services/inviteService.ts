import { supabase } from '@/integrations/supabase/client';
import type { Invite } from '@/types';

export async function fetchUserInvite(userId: string): Promise<Invite | null> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('inviter_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Invite | null;
}

export async function fetchInviteByCode(code: string): Promise<Invite | null> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('invite_code', code)
    .maybeSingle();
  if (error) throw error;
  return data as Invite | null;
}

export async function incrementInviteCount(inviteCode: string): Promise<void> {
  const invite = await fetchInviteByCode(inviteCode);
  if (!invite) return;
  const { error } = await supabase
    .from('invites')
    .update({ signup_count: invite.signup_count + 1 })
    .eq('invite_code', inviteCode);
  if (error) throw error;
}

export async function fetchLeaderboard(): Promise<Array<Invite & { profile?: { name: string; profile_photo_url: string | null } }>> {
  const { data, error } = await supabase
    .from('invites')
    .select('*, profile:profiles!invites_inviter_id_fkey(name, profile_photo_url)')
    .order('signup_count', { ascending: false })
    .limit(10);
  if (error) {
    // Fallback without join if FK doesn't exist
    const { data: fallback, error: fallbackError } = await supabase
      .from('invites')
      .select('*')
      .order('signup_count', { ascending: false })
      .limit(10);
    if (fallbackError) throw fallbackError;
    return (fallback || []) as Invite[];
  }
  return (data || []) as Array<Invite & { profile?: { name: string; profile_photo_url: string | null } }>;
}

export function getInviteUrl(code: string): string {
  return `${window.location.origin}/invite/${code}`;
}
