import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Users, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import type { EventItem } from '@/types';
import { createEvent, updateEvent, deleteEvent, updateEventApproval } from '@/services/adminService';

interface Props {
  events: EventItem[];
  onRefresh: () => void;
}

const emptyForm = {
  title: '',
  description: '',
  event_date: '',
  location: '',
  event_link: '',
  cover_image_url: '',
  event_type: '',
  visibility: 'public',
};

const statusBadge = (status: string) => {
  const cls =
    status === 'approved' ? 'bg-green-500/10 text-green-500' :
    status === 'rejected' ? 'bg-destructive/10 text-destructive' :
    'bg-yellow-500/10 text-yellow-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${cls}`}>
      {status}
    </span>
  );
};

const AdminEventsTab = ({ events, onRefresh }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (event: EventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date ? event.event_date.split('T')[0] : '',
      location: event.location || '',
      event_link: event.event_link || '',
      cover_image_url: event.image || '',
      event_type: event.event_type || '',
      visibility: event.visibility || 'public',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.event_date) {
      toast({ title: 'Title and date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        event_date: form.event_date,
        location: form.location || undefined,
        event_link: form.event_link || undefined,
        cover_image_url: form.cover_image_url || undefined,
        event_type: form.event_type || undefined,
        visibility: form.visibility,
      };
      if (editingId) {
        await updateEvent(editingId, payload);
        toast({ title: 'Event updated' });
      } else {
        await createEvent(payload);
        toast({ title: 'Event created' });
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
      await deleteEvent(deleteTarget.id);
      toast({ title: 'Event deleted' });
      setDeleteTarget(null);
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleApproval = async (eventId: string, action: 'approved' | 'rejected') => {
    try {
      await updateEventApproval(eventId, action);
      toast({ title: `Event ${action}` });
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const pendingCount = events.filter(e => e.approval_status === 'pending').length;
  const filteredEvents = filterStatus === 'all'
    ? events
    : events.filter(e => e.approval_status === filterStatus);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-bold uppercase">Events ({events.length})</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-600 font-medium">{pendingCount} pending approval</p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Filter buttons */}
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                  filterStatus === status ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filteredEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Location</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Approval</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Visibility</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold">{event.title}</TableCell>
                    <TableCell className="text-sm">{format(new Date(event.event_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-sm">{event.location || '-'}</TableCell>
                    <TableCell className="capitalize text-sm">{event.event_type?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell>{statusBadge(event.approval_status || 'approved')}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase
                        ${event.visibility === 'public' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}
                      `}>
                        {event.visibility}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {event.approval_status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleApproval(event.id, 'approved')} title="Approve">
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleApproval(event.id, 'rejected')} title="Reject">
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEdit(event)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/events/${event.id}/attendees`)}>
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(event)}>
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
          <p className="text-muted-foreground text-center py-12">
            {filterStatus === 'all' ? 'No events yet. Click "Create Event" to add one.' : `No ${filterStatus} events.`}
          </p>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Event' : 'Create Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event description" />
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Event location" />
            </div>
            <div>
              <Label>Event Link</Label>
              <Input value={form.event_link} onChange={(e) => setForm({ ...form, event_link: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
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
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
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

export default AdminEventsTab;
