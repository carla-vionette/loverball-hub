import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, VideoItem, EventItem, MemberApplication } from '@/types';

const ADMIN_EMAIL = 'carla@stori.digital';

export async function isAdminEmail(email: string): Promise<boolean> {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// ── Members ──

export async function fetchMembers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function suspendMember(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .update({ role: 'pending' })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteMember(userId: string): Promise<void> {
  // Remove role first, then profile
  await supabase.from('user_roles').delete().eq('user_id', userId);
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

// ── Applications ──

export async function fetchApplications(): Promise<MemberApplication[]> {
  const { data, error } = await supabase
    .from('member_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function handleApplication(
  applicationId: string,
  action: 'approved' | 'rejected',
  reviewerId: string,
  userId?: string | null
): Promise<void> {
  const { error: updateError } = await supabase
    .from('member_applications')
    .update({ status: action, reviewed_by_user_id: reviewerId })
    .eq('id', applicationId);
  if (updateError) throw updateError;

  if (action === 'approved' && userId) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'member' });
    if (roleError && !roleError.message.includes('duplicate')) throw roleError;
  }
}

// ── Videos (admin CRUD) ──

export async function fetchAdminVideos(): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as VideoItem[];
}

export async function createVideo(video: {
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail?: string | null;
  category?: string | null;
  uploaded_by?: string | null;
  tier?: string | null;
  duration?: string | null;
  channel_id?: string;
}): Promise<VideoItem> {
  const insertPayload = {
    title: video.title,
    description: video.description ?? null,
    video_url: video.video_url,
    thumbnail: video.thumbnail ?? null,
    category: video.category ?? null,
    uploaded_by: video.uploaded_by ?? null,
    tier: video.tier ?? 'free',
    duration: video.duration ?? null,
    channel_id: video.channel_id ?? 'default',
  };
  const { data, error } = await supabase
    .from('videos')
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;
  return data as VideoItem;
}

export async function updateVideo(id: string, updates: Partial<VideoItem>): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Events (admin CRUD) ──

export async function fetchAdminEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    event_date: e.event_date,
    location: e.location,
    event_link: e.event_link,
    image: e.cover_image_url || e.image || null,
    event_type: e.event_type,
    visibility: e.visibility || 'public',
    created_at: e.created_at,
  }));
}

export async function createEvent(event: {
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  event_link?: string;
  cover_image_url?: string;
  event_type?: string;
  visibility?: string;
}): Promise<void> {
  const { error } = await supabase.from('events').insert(event);
  if (error) throw error;
}

export async function updateEvent(id: string, updates: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('events').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

// ── CSV export ──

export function exportMembersToCSV(members: UserProfile[]): void {
  if (members.length === 0) return;
  const headers = ['Name', 'Pronouns', 'Age Range', 'City', 'Neighborhood', 'Phone', 'Instagram', 'LinkedIn', 'Website', 'Role', 'Industries', 'Looking For', 'Favorite Teams', 'Favorite Sports', 'Joined'];
  const rows = members.map(m => [
    m.name, m.pronouns || '', m.age_range || '', m.city || '', m.neighborhood || '',
    m.phone_number || '', m.instagram_url || '', m.linkedin_url || '', m.website_url || '',
    m.primary_role || '', (m.industries || []).join('; '), (m.looking_for_tags || []).join('; '),
    (m.favorite_la_teams || []).join('; '), (m.favorite_sports || []).join('; '),
    new Date(m.created_at).toISOString().split('T')[0],
  ]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `loverball_members_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
