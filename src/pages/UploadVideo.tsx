import { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Video, ArrowLeft, X, Plus, Link as LinkIcon, Upload, FileVideo } from 'lucide-react';
import { extractThumbnailFromUrl } from '@/lib/videoUtils';

interface CreatorChannel {
  id: string;
  channel_name: string;
  slug: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-m4v'];

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
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-extract thumbnail when video URL changes
  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    
    // Auto-fill thumbnail if empty and we can extract one
    if (!thumbnailUrl && url) {
      const extracted = extractThumbnailFromUrl(url);
      if (extracted) {
        setThumbnailUrl(extracted);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please select a valid video file (MP4, MOV, WebM, AVI, M4V)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: 'File too large', 
        description: 'Please select a video under 100MB',
        variant: 'destructive'
      });
      return;
    }

    setVideoFile(file);
    // Auto-fill title from filename if empty
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const uploadVideoFile = async (): Promise<string | null> => {
    if (!videoFile || !selectedChannelId) return null;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${selectedChannelId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Simulate progress since Supabase doesn't provide real progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChannelId || !title.trim()) {
      toast({ title: 'Required fields missing', description: 'Please fill in channel and title', variant: 'destructive' });
      return;
    }

    // Validate based on upload method
    if (uploadMethod === 'url') {
      if (!videoUrl.trim()) {
        toast({ title: 'Video URL required', description: 'Please enter a video URL', variant: 'destructive' });
        return;
      }
      if (!isValidUrl(videoUrl)) {
        toast({ title: 'Invalid URL', description: 'Please enter a valid video URL', variant: 'destructive' });
        return;
      }
    } else {
      if (!videoFile) {
        toast({ title: 'Video file required', description: 'Please select a video file to upload', variant: 'destructive' });
        return;
      }
    }

    if (thumbnailUrl && !isValidUrl(thumbnailUrl)) {
      toast({ title: 'Invalid thumbnail URL', description: 'Please enter a valid thumbnail URL or leave it empty', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let finalVideoUrl = videoUrl;

      // Upload file if using file upload method
      if (uploadMethod === 'file' && videoFile) {
        const uploadedUrl = await uploadVideoFile();
        if (!uploadedUrl) {
          setSubmitting(false);
          return;
        }
        finalVideoUrl = uploadedUrl;
      }

      const { data, error } = await supabase
        .from('videos')
        .insert({
          channel_id: selectedChannelId,
          title: title.trim(),
          description: description.trim() || null,
          video_url: finalVideoUrl,
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
              Back to Stories Hub
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
                    Share a video file or link from YouTube, TikTok, Vimeo
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

                {/* Video Source Tabs */}
                <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'url' | 'file')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Video URL
                    </TabsTrigger>
                    <TabsTrigger value="file" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-2 mt-4">
                    <Label htmlFor="videoUrl">Video URL *</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="videoUrl"
                        placeholder="https://youtube.com/watch?v=... or https://tiktok.com/..."
                        value={videoUrl}
                        onChange={(e) => handleVideoUrlChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste a link to YouTube, TikTok, Vimeo, or a direct video file URL
                    </p>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4 mt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-m4v"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {!videoFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <FileVideo className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium mb-1">Click to select a video</p>
                        <p className="text-xs text-muted-foreground">
                          MP4, MOV, WebM, AVI, M4V • Max 100MB
                        </p>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <FileVideo className="w-10 h-10 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{videoFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(videoFile.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVideoFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {uploading && (
                          <div className="mt-3">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Uploading... {uploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

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

                <Button type="submit" className="w-full" disabled={submitting || uploading}>
                  {submitting || uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploading ? 'Uploading...' : 'Publishing...'}
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
