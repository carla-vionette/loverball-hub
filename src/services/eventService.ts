import { supabase } from '@/integrations/supabase/client';
import type { EventItem, EventLayout, ContentTier } from '@/types';

function mapEventRow(e: Record<string, unknown>): EventItem {
  return {
    id: e.id as string,
    title: e.title as string,
    description: (e.description as string) || null,
    event_date: e.event_date as string,
    location: (e.location as string) || null,
    event_link: (e.event_link as string) || null,
    image: (e.cover_image_url as string) || (e.image as string) || null,
    event_type: (e.event_type as string) || null,
    visibility: (e.visibility as string) || 'public',
    created_at: e.created_at as string,
    tier: (e.tier as ContentTier) || 'free',
    layout_json: (e.layout_json as EventLayout) || null,
    banner_image: (e.banner_image as string) || null,
  };
}

export async function fetchEvents(filters?: {
  tier?: ContentTier;
  search?: string;
  upcoming?: boolean;
}): Promise<EventItem[]> {
  let query = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (filters?.tier) {
    query = query.eq('tier', filters.tier);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters?.upcoming) {
    query = query.gte('event_date', new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapEventRow);
}

export async function fetchEventById(id: string): Promise<EventItem | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapEventRow(data);
}

export async function saveEventLayout(eventId: string, layout: EventLayout): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ layout_json: layout as unknown as Record<string, unknown> })
    .eq('id', eventId);
  if (error) throw error;
}
