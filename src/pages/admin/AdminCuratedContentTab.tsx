import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '@/services/adminActivityService';

interface CuratedItem {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  sport: string | null;
  team_tag: string | null;
  content_type: string;
  date: string;
  created_at: string;
}

const emptyForm = { title: '', body: '', image_url: '', sport: '', team_tag: '', content_type: 'highlight', date: new Date().toISOString().split('T')[0] };

const AdminCuratedContentTab = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<CuratedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CuratedItem | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('curated_content').select('*').order('date', { ascending: false });
    setItems((data || []) as CuratedItem[]);
    setLoading(false);
  }

  const openEdit = (item: CuratedItem) => {
    setEditingId(item.id);
    setForm({ title: item.title, body: item.body || '', image_url: item.image_url || '', sport: item.sport || '', team_tag: item.team_tag || '', content_type: item.content_type, date: item.date });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    const payload = {
      title: form.title,
      body: form.body || null,
      image_url: form.image_url || null,
      sport: form.sport || null,
      team_tag: form.team_tag || null,
      content_type: form.content_type,
      date: form.date,
    };
    try {
      if (editingId) {
        await supabase.from('curated_content').update(payload).eq('id', editingId);
        await logAdminAction('curated_content_updated', 'curated_content', editingId);
        toast({ title: 'Content updated' });
      } else {
        const { data } = await supabase.from('curated_content').insert(payload).select().single();
        await logAdminAction('curated_content_created', 'curated_content', data?.id);
        toast({ title: 'Content created' });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('curated_content').delete().eq('id', deleteTarget.id);
    await logAdminAction('curated_content_deleted', 'curated_content', deleteTarget.id);
    toast({ title: 'Deleted' });
    setDeleteTarget(null);
    load();
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold uppercase">Curated Content ({items.length})</h2>
        <Button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Content
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Sport</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold text-sm">{item.title}</TableCell>
                    <TableCell className="capitalize text-sm">{item.content_type}</TableCell>
                    <TableCell className="text-sm">{item.sport || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(item)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No curated content yet.</p>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Create'} Curated Content</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Body</Label><Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} /></div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sport</Label><Input value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })} /></div>
              <div><Label>Team Tag</Label><Input value={form.team_tag} onChange={e => setForm({ ...form, team_tag: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.content_type} onValueChange={v => setForm({ ...form, content_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highlight">Highlight</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="stat">Stat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>Delete "{deleteTarget?.title}"? This cannot be undone.</AlertDialogDescription>
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

export default AdminCuratedContentTab;
