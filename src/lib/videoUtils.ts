// Utility functions for video handling

/**
 * Extract video ID and generate thumbnail URL from various video platforms
 */
export const extractThumbnailFromUrl = (videoUrl: string): string | null => {
  try {
    const url = new URL(videoUrl);
    
    // YouTube
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      let videoId: string | null = null;
      
      if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get('v');
      }
      
      if (videoId) {
        // Use maxresdefault for best quality, falls back to hqdefault
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    
    // Vimeo - we can't easily get thumbnails without API, but we can try oEmbed
    // For now, return null and let the default placeholder handle it
    if (url.hostname.includes('vimeo.com')) {
      return null;
    }
    
    // TikTok - thumbnails require API access
    if (url.hostname.includes('tiktok.com')) {
      return null;
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Default placeholder thumbnail for videos without a thumbnail
 */
export const DEFAULT_VIDEO_THUMBNAIL = '/placeholder.svg';

/**
 * Get the display thumbnail for a video
 */
export const getVideoThumbnail = (
  thumbnailUrl: string | null | undefined, 
  videoUrl?: string
): string => {
  // If thumbnail is provided, use it
  if (thumbnailUrl) {
    return thumbnailUrl;
  }
  
  // Try to extract from video URL
  if (videoUrl) {
    const extracted = extractThumbnailFromUrl(videoUrl);
    if (extracted) {
      return extracted;
    }
  }
  
  // Return default placeholder
  return DEFAULT_VIDEO_THUMBNAIL;
};
