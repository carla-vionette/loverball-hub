import { supabase } from '@/integrations/supabase/client';
import type { EventItem, EventLayout } from '@/types';

export async function fetchEvents(options?: {
  upcoming?: boolean;
  tier?: string;
  search?: string;
  limit?: number;
}): Promise<EventItem[]> {
  let query = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (options?.upcoming) {
    query = query.gte('event_date', new Date().toISOString());
  }
  if (options?.tier) {
    query = query.eq('tier', options.tier);
  }
  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapEvent);
}

export async function fetchEventById(id: string): Promise<EventItem | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data) : null;
}

export async function saveEventLayout(eventId: string, layout: EventLayout): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ layout_json: layout as unknown as Record<string, unknown> })
    .eq('id', eventId);
  if (error) throw error;
}

function mapEvent(e: Record<string, unknown>): EventItem {
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
    tier: (e.tier as EventItem['tier']) || null,
    layout_json: (e.layout_json as EventLayout) || null,
    banner_image: (e.banner_image as string) || null,
  };
}
