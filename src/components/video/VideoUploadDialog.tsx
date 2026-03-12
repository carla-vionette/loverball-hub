import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2 } from 'lucide-react';
import { uploadVideoFile, uploadThumbnail, VIDEO_CATEGORIES } from '@/services/videoService';
import { createVideo } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { ContentTier } from '@/types';

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const VideoUploadDialog = ({ open, onOpenChange, onSuccess }: VideoUploadDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    tier: 'free' as ContentTier,
    duration: '',
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);

  const reset = () => {
    setForm({ title: '', description: '', category: '', tier: 'free', duration: '' });
    setVideoFile(null);
    setThumbFile(null);
    setProgress(0);
  };

  const handleSubmit = async () => {
    if (!form.title) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!videoFile) {
      toast({ title: 'Video file is required', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setProgress(10);
    try {
      // Upload video file
      const videoUrl = await uploadVideoFile(videoFile, setProgress);

      // Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (thumbFile) {
        thumbnailUrl = await uploadThumbnail(thumbFile);
      }

      // Create video record
      await createVideo({
        title: form.title,
        description: form.description || null,
        video_url: videoUrl,
        thumbnail: thumbnailUrl,
        category: form.category || null,
        uploaded_by: user?.id || null,
      });

      toast({ title: 'Video uploaded successfully' });
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Video
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Video title"
              disabled={uploading}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
              disabled={uploading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} disabled={uploading}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {VIDEO_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v as ContentTier })} disabled={uploading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="digital">All Access</SelectItem>
                  <SelectItem value="local">The Club</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Duration</Label>
            <Input
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="e.g. 12:34"
              disabled={uploading}
            />
          </div>
          <div>
            <Label>Video File *</Label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
            >
              {videoFile ? videoFile.name : 'Choose video file...'}
            </Button>
          </div>
          <div>
            <Label>Thumbnail Image</Label>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => thumbInputRef.current?.click()}
              disabled={uploading}
            >
              {thumbFile ? thumbFile.name : 'Choose thumbnail...'}
            </Button>
          </div>

          {uploading && (
            <div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Uploading... {progress}%</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoUploadDialog;
