import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import type { EventItem } from '@/types';
import { handleEventApproval } from '@/services/adminService';

interface Props {
  events: EventItem[];
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-destructive/10 text-destructive',
};

const AdminEventApprovalsTab = ({ events, onRefresh }: Props) => {
  const { toast } = useToast();

  const onAction = async (eventId: string, action: 'approved' | 'rejected') => {
    try {
      await handleEventApproval(eventId, action);
      toast({ title: `Event ${action}` });
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const pendingEvents = events.filter(e => e.approval_status === 'pending');
  const otherEvents = events.filter(e => e.approval_status && e.approval_status !== 'pending' && e.approval_status !== 'approved');

  return (
    <section className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold uppercase mb-4">
          Event Approvals
          {pendingEvents.length > 0 && (
            <Badge variant="destructive" className="ml-3 text-xs">
              {pendingEvents.length} pending
            </Badge>
          )}
        </h2>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {pendingEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Location</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold">{event.title}</TableCell>
                    <TableCell className="text-sm">{format(new Date(event.event_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-sm">{event.location || '-'}</TableCell>
                    <TableCell className="capitalize text-sm">{event.event_type?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${statusColors[event.approval_status || 'pending']}`}>
                        {event.approval_status || 'pending'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => onAction(event.id, 'approved')}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => onAction(event.id, 'rejected')}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-12">No pending events to review</p>
          )}
        </div>
      </div>

      {/* Rejected events */}
      {otherEvents.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold uppercase mb-3">Rejected Events</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold">{event.title}</TableCell>
                    <TableCell className="text-sm">{format(new Date(event.event_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${statusColors[event.approval_status || 'rejected']}`}>
                        {event.approval_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => onAction(event.id, 'approved')}>
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminEventApprovalsTab;
