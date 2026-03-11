import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import type { MemberApplication } from '@/types';
import { handleApplication } from '@/services/adminService';

interface Props {
  applications: MemberApplication[];
  userId: string;
  onRefresh: () => void;
}

const AdminApplicationsTab = ({ applications, userId, onRefresh }: Props) => {
  const { toast } = useToast();

  const onAction = async (appId: string, action: 'approved' | 'rejected', appUserId?: string | null) => {
    try {
      await handleApplication(appId, action, userId, appUserId);
      toast({ title: `Application ${action}` });
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <section>
      <h2 className="font-display text-xl font-bold uppercase mb-4">Member Applications</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {applications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Role</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Social</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell className="font-semibold">{app.name}</TableCell>
                  <TableCell>{app.role_title || '-'}</TableCell>
                  <TableCell>
                    {app.instagram_or_linkedin_url ? (
                      <a href={app.instagram_or_linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        View
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase
                      ${app.status === 'approved' ? 'bg-green-500/10 text-green-500' : ''}
                      ${app.status === 'rejected' ? 'bg-destructive/10 text-destructive' : ''}
                      ${app.status === 'pending' ? 'bg-secondary text-muted-foreground' : ''}
                    `}>
                      {app.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onAction(app.id, 'approved', app.user_id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onAction(app.id, 'rejected', app.user_id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-12">No applications yet</p>
        )}
      </div>
    </section>
  );
};

export default AdminApplicationsTab;
