import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, VideoItem, EventItem, MemberApplication, CreatorApplication } from '@/types';

export async function isAdminEmail(email: string): Promise<boolean> {
  // Check admin role via user_roles table instead of hardcoded email
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  return !!data;
}

// ── Members ──

export async function fetchMembers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UserProfile[];
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
  approval_status?: string;
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
    approval_status: video.approval_status ?? 'approved',
  };
  const { data, error } = await supabase
    .from('videos')
    .insert(insertPayload as never)
    .select()
    .single();
  if (error) throw error;
  return data as VideoItem;
}

export async function updateVideo(id: string, updates: Partial<VideoItem>): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update(updates as never)
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
    image: e.cover_image_url || e.image_url || null,
    event_type: e.event_type,
    visibility: e.visibility || 'public',
    created_at: e.created_at,
    tier: e.tier || null,
    layout_json: e.layout_json || null,
    banner_image: e.banner_image || null,
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
  approval_status?: string;
  submitted_by?: string;
}): Promise<void> {
  const { error } = await supabase.from('events').insert({
    ...event,
    approval_status: event.approval_status ?? 'approved',
  });
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

// ── Creator/Team/Org Applications ──

export async function submitCreatorApplication(application: {
  user_id: string;
  account_type: 'team' | 'creator' | 'organization';
  official_email: string;
  phone_number: string;
  social_links: Record<string, string>;
  content_bio?: string;
  org_name?: string;
}): Promise<void> {
  // Insert the application
  const { error: appError } = await supabase
    .from('creator_applications' as any)
    .insert(application as any);
  if (appError) throw appError;

  // Update profile account_type (approval is tracked in creator_applications table)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      account_type: application.account_type,
    })
    .eq('id', application.user_id);
  if (profileError) throw profileError;
}

export async function fetchCreatorApplications(): Promise<CreatorApplication[]> {
  const { data, error } = await supabase
    .from('creator_applications' as any)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const apps = (data || []) as any[];

  // Fetch profile names for display
  const userIds = apps.map((a: any) => a.user_id);
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, profile_photo_url')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    return apps.map((a: any) => ({
      ...a,
      applicant_name: profileMap.get(a.user_id)?.name || 'Unknown',
      profile_photo_url: profileMap.get(a.user_id)?.profile_photo_url || null,
    }));
  }

  return apps;
}

export async function handleCreatorApplication(
  applicationId: string,
  action: 'approved' | 'rejected',
  reviewerId: string
): Promise<void> {
  // Update the application
  const { data: app, error: fetchError } = await supabase
    .from('creator_applications' as any)
    .update({
      status: action,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    } as any)
    .eq('id', applicationId)
    .select()
    .single();
  if (fetchError) throw fetchError;

  const appData = app as any;

  // Approval status is tracked in creator_applications table, not profiles

  // If approved, ensure user has member role
  if (action === 'approved') {
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: appData.user_id, role: 'member' }, { onConflict: 'user_id' });
    if (roleError && !roleError.message.includes('duplicate')) throw roleError;
  }
}

// ── Event Approvals ──

export async function fetchPendingEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    event_date: e.event_date,
    location: e.location,
    event_link: e.event_link,
    image: e.cover_image_url || e.image_url || null,
    event_type: e.event_type,
    visibility: e.visibility || 'public',
    created_at: e.created_at,
    tier: e.tier || null,
    layout_json: e.layout_json || null,
    banner_image: e.banner_image || null,
    approval_status: e.approval_status || 'approved',
    submitted_by: e.submitted_by || null,
  }));
}

export async function handleEventApproval(
  eventId: string,
  action: 'approved' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ approval_status: action } as any)
    .eq('id', eventId);
  if (error) throw error;
}

// ── Video Approvals ──

export async function fetchAllVideosForAdmin(): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as VideoItem[];
}

export async function handleVideoApproval(
  videoId: string,
  action: 'approved' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update({ approval_status: action } as any)
    .eq('id', videoId);
  if (error) throw error;
}

// ── CSV export ──

export function exportMembersToCSV(members: UserProfile[]): void {
  if (members.length === 0) return;
  const headers = ['Name', 'Pronouns', 'Age Range', 'City', 'Neighborhood', 'Instagram', 'LinkedIn', 'Website', 'Role', 'Industries', 'Looking For', 'Favorite Teams', 'Favorite Sports', 'Joined'];
  const rows = members.map(m => [
    m.name, m.pronouns || '', m.age_range || '', m.city || '', m.neighborhood || '',
    m.instagram_url || '', m.linkedin_url || '', m.website_url || '',
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
