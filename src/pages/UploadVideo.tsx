import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Video, ArrowLeft, X, Plus, Link as LinkIcon } from 'lucide-react';

interface CreatorChannel {
  id: string;
  channel_name: string;
  slug: string;
}

const UploadVideo = () => {
  const [channels, setChannels] = useState<CreatorChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMyChannels();
  }, [user, navigate]);

  const fetchMyChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_channels')
        .select('id, channel_name, slug')
        .eq('owner_user_id', user!.id)
        .eq('status', 'approved');

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ 
          title: 'No approved channels', 
          description: 'You need an approved channel to upload videos',
          variant: 'destructive'
        });
        navigate('/apply-creator');
        return;
      }

      setChannels(data);
      setSelectedChannelId(data[0].id);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChannelId || !title.trim() || !videoUrl.trim()) {
      toast({ title: 'Required fields missing', description: 'Please fill in channel, title, and video URL', variant: 'destructive' });
      return;
    }

    if (!isValidUrl(videoUrl)) {
      toast({ title: 'Invalid URL', description: 'Please enter a valid video URL', variant: 'destructive' });
      return;
    }

    if (thumbnailUrl && !isValidUrl(thumbnailUrl)) {
      toast({ title: 'Invalid thumbnail URL', description: 'Please enter a valid thumbnail URL or leave it empty', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert({
          channel_id: selectedChannelId,
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim(),
          thumbnail_url: thumbnailUrl.trim() || null,
          tags,
          is_published: true,
          published_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      toast({ title: 'Video published!', description: 'Your video is now live on your channel.' });
      
      const channel = channels.find(c => c.id === selectedChannelId);
      navigate(`/channel/${channel?.slug}`);
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/hub">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Video Hub
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Upload Video</CardTitle>
                  <CardDescription>
                    Share a video from YouTube, TikTok, Vimeo, or any video URL
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Channel Selection */}
                {channels.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="channel">Channel</Label>
                    <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.channel_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Video URL */}
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL *</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="videoUrl"
                      placeholder="https://youtube.com/watch?v=... or https://tiktok.com/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a link to YouTube, TikTok, Vimeo, or a direct video file URL
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Give your video a catchy title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add context or description for your video"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Thumbnail URL */}
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
                  <Input
                    id="thumbnailUrl"
                    placeholder="https://example.com/thumbnail.jpg"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional custom thumbnail image URL
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (up to 5)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add a tag and press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      disabled={tags.length >= 5}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addTag}
                      disabled={tags.length >= 5 || !tagInput.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Video'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UploadVideo;
