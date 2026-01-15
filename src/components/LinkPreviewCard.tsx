import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Globe, Loader2 } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}

interface LinkPreviewCardProps {
  url: string;
}

// Cache for link previews to avoid refetching
const previewCache = new Map<string, LinkPreviewData | null>();

const LinkPreviewCard = ({ url }: LinkPreviewCardProps) => {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      // Check cache first
      if (previewCache.has(url)) {
        const cached = previewCache.get(url);
        setPreview(cached || null);
        setError(!cached);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.functions.invoke('fetch-link-preview', {
          body: { url }
        });

        if (fetchError || data?.error) {
          previewCache.set(url, null);
          setError(true);
        } else {
          previewCache.set(url, data);
          setPreview(data);
        }
      } catch (err) {
        console.error('Error fetching link preview:', err);
        previewCache.set(url, null);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Get display domain from URL
  const getDomain = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace('www.', '');
    } catch {
      return urlStr;
    }
  };

  // Check if it's a known platform for special styling
  const getSpecialPlatform = (urlStr: string): string | null => {
    const domain = getDomain(urlStr).toLowerCase();
    if (domain.includes('instagram.com')) return 'instagram';
    if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
    if (domain.includes('linkedin.com')) return 'linkedin';
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'youtube';
    if (domain.includes('tiktok.com')) return 'tiktok';
    if (domain.includes('spotify.com')) return 'spotify';
    return null;
  };

  const platform = getSpecialPlatform(url);

  if (loading) {
    return (
      <Card className="w-full max-w-sm overflow-hidden animate-pulse">
        <div className="flex items-center gap-3 p-3">
          <div className="w-16 h-16 bg-muted rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !preview) {
    // Show minimal fallback card for failed previews
    return (
      <Card 
        className="w-full max-w-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border/50"
        onClick={handleClick}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">{getDomain(url)}</p>
            <p className="text-xs text-muted-foreground truncate">{url}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </CardContent>
      </Card>
    );
  }

  const hasImage = preview.image && !imageError;

  return (
    <Card 
      className="w-full max-w-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border/50"
      onClick={handleClick}
    >
      <div className="flex">
        {/* Image thumbnail */}
        {hasImage && (
          <div className="w-24 h-24 flex-shrink-0 bg-muted">
            <img 
              src={preview.image!}
              alt={preview.title || 'Link preview'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        {/* Content */}
        <CardContent className={`p-3 flex-1 min-w-0 flex flex-col justify-center ${!hasImage ? 'pl-3' : ''}`}>
          {/* Site info */}
          <div className="flex items-center gap-1.5 mb-1">
            {preview.favicon && !imageError ? (
              <img 
                src={preview.favicon} 
                alt="" 
                className="w-4 h-4 rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground truncate">
              {preview.siteName || getDomain(preview.url)}
            </span>
          </div>
          
          {/* Title */}
          {preview.title && (
            <h4 className="font-semibold text-sm line-clamp-2 mb-1">{preview.title}</h4>
          )}
          
          {/* Description */}
          {preview.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {preview.description}
            </p>
          )}
          
          {/* External link indicator */}
          <div className="flex items-center gap-1 mt-1.5 text-xs text-primary font-medium">
            <ExternalLink className="w-3 h-3" />
            <span>Open link</span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default LinkPreviewCard;
