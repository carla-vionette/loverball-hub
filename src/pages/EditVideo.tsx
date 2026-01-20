import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, X, Plus, Link as LinkIcon, Trash2, Video } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  tags: string[];
  channel_id: string;
  is_published: boolean;
}

interface Channel {
  id: string;
  slug: string;
  channel_name: string;
  owner_user_id: string;
}

const EditVideo = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchVideo();
    }
  }, [user, id, navigate]);

  const fetchVideo = async () => {
    try {
      // First get the video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (videoError || !videoData) {
        toast({ title: 'Video not found', variant: 'destructive' });
        navigate('/hub');
        return;
      }

      // Then verify ownership through channel
      const { data: channelData, error: channelError } = await supabase
        .from('creator_channels')
        .select('id, slug, channel_name, owner_user_id')
        .eq('id', videoData.channel_id)
        .eq('owner_user_id', user!.id)
        .single();

      if (channelError || !channelData) {
        toast({ title: 'Access denied', description: 'You can only edit your own videos', variant: 'destructive' });
        navigate('/hub');
        return;
      }

      setVideo(videoData);
      setChannel(channelData);
      setTitle(videoData.title);
      setDescription(videoData.description || '');
      setVideoUrl(videoData.video_url);
      setThumbnailUrl(videoData.thumbnail_url || '');
      setTags(videoData.tags || []);
      setIsPublished(videoData.is_published);
    } catch (error) {
      console.error('Error fetching video:', error);
      navigate('/hub');
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

    if (!title.trim() || !videoUrl.trim()) {
      toast({ title: 'Required fields missing', description: 'Please fill in title and video URL', variant: 'destructive' });
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

    setSaving(true);
    try {
      const { error } = await supabase
        .from('videos')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim(),
          thumbnail_url: thumbnailUrl.trim() || null,
          tags,
          is_published: isPublished
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Video updated!', description: 'Your changes have been saved.' });
      navigate(`/channel/${channel?.slug}`);
    } catch (error: any) {
      console.error('Error updating video:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!video || !channel) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;

      toast({ title: 'Video deleted', description: 'Your video has been removed.' });
      navigate(`/channel/${channel.slug}`);
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!video || !channel) {
    return null;
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
            <Link to={`/channel/${channel.slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {channel.channel_name}
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Edit Video</CardTitle>
                    <CardDescription>Update your video details</CardDescription>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={deleting}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this video?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The video "{video.title}" will be permanently removed from your channel.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Video'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Video URL */}
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL *</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="videoUrl"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Video title"
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
                    placeholder="Add context or description"
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

                {/* Publish toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <Label htmlFor="isPublished" className="cursor-pointer">
                    Published (visible to viewers)
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" asChild className="flex-1">
                    <Link to={`/channel/${channel.slug}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditVideo;
