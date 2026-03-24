import { supabase } from '@/integrations/supabase/client';
import type { VideoItem, ContentTier } from '@/types';

export async function fetchVideos(options?: {
  category?: string;
  tier?: ContentTier;
  search?: string;
  limit?: number;
}): Promise<VideoItem[]> {
  let query = supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.category) {
    query = query.eq('category', options.category);
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
  return (data || []) as VideoItem[];
}

export async function fetchVideoById(id: string): Promise<VideoItem | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as VideoItem | null;
}

export async function fetchRelatedVideos(videoId: string, category: string | null): Promise<VideoItem[]> {
  let query = supabase
    .from('videos')
    .select('*')
    .neq('id', videoId)
    .order('created_at', { ascending: false })
    .limit(6);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as VideoItem[];
}

export async function uploadVideoFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  // Supabase JS doesn't support upload progress natively, so we simulate
  if (onProgress) onProgress(10);

  const { error } = await supabase.storage
    .from('videos')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  if (onProgress) onProgress(100);

  const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);
  return urlData.publicUrl;
}

export async function uploadThumbnail(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `thumbnails/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('videos')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);
  return urlData.publicUrl;
}

export const VIDEO_CATEGORIES = [
  'Basketball',
  'Soccer',
  'Tennis',
  'WNBA',
  'Culture',
  'Fitness',
  'Highlights',
  'Interviews',
  'Training',
  'Events',
  'Community',
  'Other',
];
