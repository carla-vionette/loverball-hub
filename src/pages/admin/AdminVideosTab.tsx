import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { VideoItem } from '@/types';
import { createVideo, updateVideo, deleteVideo } from '@/services/adminService';

interface Props {
  videos: VideoItem[];
  onRefresh: () => void;
}

const VIDEO_CATEGORIES = ['Highlights', 'Interviews', 'Training', 'Events', 'Community', 'Other'];

const emptyForm = { title: '', description: '', video_url: '', thumbnail: '', category: '' };

const AdminVideosTab = ({ videos, onRefresh }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<VideoItem | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (video: VideoItem) => {
    setEditingId(video.id);
    setForm({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      thumbnail: video.thumbnail || '',
      category: video.category || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.video_url) {
      toast({ title: 'Title and Video URL are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateVideo(editingId, {
          title: form.title,
          description: form.description || null,
          video_url: form.video_url,
          thumbnail: form.thumbnail || null,
          category: form.category || null,
        });
        toast({ title: 'Video updated' });
      } else {
        await createVideo({
          title: form.title,
          description: form.description || null,
          video_url: form.video_url,
          thumbnail: form.thumbnail || null,
          category: form.category || null,
          uploaded_by: user?.id || null,
        });
        toast({ title: 'Video created' });
      }
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVideo(deleteTarget.id);
      toast({ title: 'Video deleted' });
      setDeleteTarget(null);
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold uppercase">Videos ({videos.length})</h2>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Video
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {videos.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Category</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">URL</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Created</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold">{video.title}</TableCell>
                    <TableCell className="text-sm">{video.category || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {video.video_url}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(video.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(video)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(video)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No videos yet. Click "Add Video" to upload one.</p>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Video' : 'Add Video'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Video title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div>
              <Label>Video URL *</Label>
              <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {VIDEO_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default AdminVideosTab;
