import { supabase } from '@/integrations/supabase/client';
import type { VideoItem, ContentTier } from '@/types';

export async function fetchVideos(filters?: {
  category?: string;
  tier?: ContentTier;
  search?: string;
}): Promise<VideoItem[]> {
  let query = supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.tier) {
    query = query.eq('tier', filters.tier);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(v => ({ ...v, tier: v.tier || 'free', duration: v.duration || null })) as VideoItem[];
}

export async function fetchVideoById(id: string): Promise<VideoItem | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, tier: data.tier || 'free', duration: data.duration || null } as VideoItem;
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
  return (data || []).map(v => ({ ...v, tier: v.tier || 'free', duration: v.duration || null })) as VideoItem[];
}

export async function uploadVideoFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `uploads/${fileName}`;

  // Supabase JS v2 doesn't have native progress, simulate it
  if (onProgress) onProgress(10);

  const { error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;
  if (onProgress) onProgress(100);

  const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function uploadThumbnail(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `thumb-${Date.now()}.${ext}`;
  const filePath = `thumbnails/${fileName}`;

  const { error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath);
  return urlData.publicUrl;
}
