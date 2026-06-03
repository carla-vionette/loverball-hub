import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import type { VideoItem } from '@/types';
import { handleVideoApproval } from '@/services/adminService';

interface Props {
  videos: VideoItem[];
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-destructive/10 text-destructive',
};

const AdminVideoApprovalsTab = ({ videos, onRefresh }: Props) => {
  const { toast } = useToast();

  const onAction = async (videoId: string, action: 'approved' | 'rejected') => {
    try {
      await handleVideoApproval(videoId, action);
      toast({ title: `Video ${action}` });
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const pendingVideos = videos.filter(v => v.approval_status === 'pending');
  const otherVideos = videos.filter(v => v.approval_status && v.approval_status !== 'pending' && v.approval_status !== 'approved');

  return (
    <section className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold uppercase mb-4">
          Video/Content Approvals
          {pendingVideos.length > 0 && (
            <Badge variant="destructive" className="ml-3 text-xs">
              {pendingVideos.length} pending
            </Badge>
          )}
        </h2>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {pendingVideos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Category</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Uploaded</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVideos.map((video) => (
                  <TableRow key={video.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {video.thumbnail && (
                          <img src={video.thumbnail} alt="" className="w-16 h-10 object-cover rounded" loading="lazy" decoding="async" />
                        )}
                        <span className="font-semibold">{video.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{video.category || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(video.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${statusColors[video.approval_status || 'pending']}`}>
                        {video.approval_status || 'pending'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => onAction(video.id, 'approved')}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => onAction(video.id, 'rejected')}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-12">No pending videos to review</p>
          )}
        </div>
      </div>

      {/* Rejected videos */}
      {otherVideos.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold uppercase mb-3">Rejected Videos</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Category</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherVideos.map((video) => (
                  <TableRow key={video.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold">{video.title}</TableCell>
                    <TableCell className="text-sm">{video.category || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${statusColors[video.approval_status || 'rejected']}`}>
                        {video.approval_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => onAction(video.id, 'approved')}>
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

export default AdminVideoApprovalsTab;
