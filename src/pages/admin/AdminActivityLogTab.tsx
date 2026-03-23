import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fetchActivityLog, type ActivityLogEntry } from '@/services/adminActivityService';

const actionLabels: Record<string, string> = {
  creator_application_approved: '✅ Approved creator application',
  creator_application_rejected: '❌ Rejected creator application',
  curated_content_created: '📝 Created curated content',
  curated_content_updated: '✏️ Updated curated content',
  curated_content_deleted: '🗑️ Deleted curated content',
  member_deleted: '🗑️ Deleted member',
  member_suspended: '⏸️ Suspended member',
  event_created: '📅 Created event',
  event_updated: '✏️ Updated event',
  event_deleted: '🗑️ Deleted event',
  video_created: '🎬 Created video',
  video_deleted: '🗑️ Deleted video',
};

const AdminActivityLogTab = () => {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLog(100)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <section>
      <h2 className="font-display text-xl font-bold uppercase mb-4">Activity Log</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Action</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Target</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm font-medium">
                      {actionLabels[entry.action_type] || entry.action_type}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.target_type} {entry.target_id ? `(${entry.target_id.slice(0, 8)}...)` : ''}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No activity logged yet.</p>
        )}
      </div>
    </section>
  );
};

export default AdminActivityLogTab;
