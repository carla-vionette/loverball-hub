import { supabase } from '@/integrations/supabase/client';
import type { VideoItem, EventItem } from '@/types';

export async function fetchPublicVideos(): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as VideoItem[];
}

export async function fetchPublicEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
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

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}
