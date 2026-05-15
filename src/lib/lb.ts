// Loverball data layer — talks to lb_* tables only.
import { supabase } from '@/integrations/supabase/client';

// Typed via "any" because lb_* tables aren't in the auto-generated Database types yet.
// We keep the surface small and explicit.
const db = supabase as unknown as {
  from: (t: string) => any;
};

export type Pillar = 'local' | 'cultural' | 'sports';

export interface LBEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pillar: Pillar;
  hero_image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  neighborhood: string | null;
  is_private: boolean;
  host_user_id: string | null;
  capacity: number | null;
}

export interface LBUser {
  id: string;
  phone: string | null;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  birthday: string | null;
  profile_completion: number;
  created_via_event_id: string | null;
  favorite_sports: string[];
  favorite_team_ids: string[];
  vibe_tags: string[];
}

export interface LBRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'declined';
  plus_one_count: number;
  referral_user_id: string | null;
  created_at: string;
}

export interface LBTeam {
  id: string;
  name: string;
  sport: string;
  league: string;
  logo_url: string | null;
}

export async function fetchEvents(opts?: { upcomingOnly?: boolean }): Promise<LBEvent[]> {
  let q = db.from('lb_events').select('*').order('starts_at', { ascending: true });
  if (opts?.upcomingOnly) q = q.gte('starts_at', new Date().toISOString());
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as LBEvent[];
}

export async function fetchEventBySlug(slug: string): Promise<LBEvent | null> {
  const { data, error } = await db.from('lb_events').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return (data || null) as LBEvent | null;
}

export async function fetchEventRsvps(eventId: string) {
  const { data, error } = await db.from('lb_rsvps').select('*').eq('event_id', eventId);
  if (error) throw error;
  return (data || []) as LBRsvp[];
}

export async function fetchUsersByIds(ids: string[]): Promise<LBUser[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from('lb_users').select('*').in('id', ids);
  if (error) throw error;
  return (data || []) as LBUser[];
}

export async function fetchMyProfile(userId: string): Promise<LBUser | null> {
  const { data, error } = await db.from('lb_users').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data || null) as LBUser | null;
}

export async function updateMyProfile(userId: string, patch: Partial<LBUser>): Promise<LBUser> {
  const { data, error } = await db
    .from('lb_users').update(patch).eq('id', userId).select().single();
  if (error) throw error;
  return data as LBUser;
}

export async function rsvpToEvent(opts: {
  eventId: string;
  userId: string;
  referralUserId?: string | null;
}): Promise<LBRsvp> {
  const { data, error } = await db.from('lb_rsvps').upsert({
    event_id: opts.eventId,
    user_id: opts.userId,
    status: 'going',
    referral_user_id: opts.referralUserId ?? null,
  }, { onConflict: 'event_id,user_id' }).select().single();
  if (error) throw error;

  // First-time user: stamp created_via_event_id (only if null)
  await db.from('lb_users')
    .update({ created_via_event_id: opts.eventId })
    .eq('id', opts.userId)
    .is('created_via_event_id', null);

  return data as LBRsvp;
}

export async function fetchMyRsvps(userId: string): Promise<LBRsvp[]> {
  const { data, error } = await db.from('lb_rsvps').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []) as LBRsvp[];
}

export async function fetchTeams(): Promise<LBTeam[]> {
  const { data, error } = await db.from('lb_teams').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return (data || []) as LBTeam[];
}

export async function fetchReferralCount(userId: string): Promise<number> {
  const { count, error } = await db.from('lb_rsvps')
    .select('id', { count: 'exact', head: true })
    .eq('referral_user_id', userId);
  if (error) throw error;
  return count || 0;
}
