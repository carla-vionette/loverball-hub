import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { MemberApplication, CreatorApplication } from '@/types';
import { handleApplication, handleCreatorApplication } from '@/services/adminService';

interface Props {
  applications: MemberApplication[];
  creatorApplications: CreatorApplication[];
  userId: string;
  onRefresh: () => void;
}

const statusBadge = (status: string) => {
  const cls =
    status === 'approved' ? 'bg-green-500/10 text-green-500' :
    status === 'rejected' ? 'bg-destructive/10 text-destructive' :
    'bg-secondary text-muted-foreground';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${cls}`}>
      {status}
    </span>
  );
};

const AdminApplicationsTab = ({ applications, creatorApplications, userId, onRefresh }: Props) => {
  const { toast } = useToast();
  const [detailApp, setDetailApp] = useState<CreatorApplication | null>(null);

  const onMemberAction = async (appId: string, action: 'approved' | 'rejected', appUserId?: string | null) => {
    try {
      await handleApplication(appId, action, userId, appUserId);
      toast({ title: `Application ${action}` });
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const onCreatorAction = async (appId: string, action: 'approved' | 'rejected') => {
    try {
      await handleCreatorApplication(appId, action, userId);
      toast({ title: `Creator application ${action}` });
      setDetailApp(null);
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const pendingCreatorApps = creatorApplications.filter(a => a.status === 'pending');
  const reviewedCreatorApps = creatorApplications.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-10">
      {/* Creator / Team / Organization Applications */}
      <section>
        <h2 className="font-display text-xl font-bold uppercase mb-1">
          Creator & Team Applications
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pending: {pendingCreatorApps.length} | Reviewed: {reviewedCreatorApps.length}
        </p>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {creatorApplications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Email</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creatorApplications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold">
                      {app.org_name || app.user_name || app.official_email}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-primary/10 text-primary">
                        {app.account_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{app.official_email}</TableCell>
                    <TableCell>{statusBadge(app.status)}</TableCell>
                    <TableCell className="text-sm">{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetailApp(app)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {app.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => onCreatorAction(app.id, 'approved')}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onCreatorAction(app.id, 'rejected')}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-12">No creator/team applications yet</p>
          )}
        </div>
      </section>

      {/* Original Member Applications */}
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
                    <TableCell>{statusBadge(app.status)}</TableCell>
                    <TableCell className="text-sm">{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onMemberAction(app.id, 'approved', app.user_id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onMemberAction(app.id, 'rejected', app.user_id)}>
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
            <p className="text-muted-foreground text-center py-12">No member applications yet</p>
          )}
        </div>
      </section>

      {/* Detail Dialog */}
      <Dialog open={!!detailApp} onOpenChange={(open) => !open && setDetailApp(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {detailApp && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Account Type</p>
                  <p className="font-semibold capitalize">{detailApp.account_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  {statusBadge(detailApp.status)}
                </div>
                {detailApp.org_name && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Organization / Team Name</p>
                    <p className="font-semibold">{detailApp.org_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                  <p>{detailApp.official_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p>{detailApp.phone_number}</p>
                </div>
              </div>

              {/* Social links */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Social Media</p>
                <div className="flex flex-wrap gap-2">
                  {detailApp.social_links && Object.entries(detailApp.social_links)
                    .filter(([, v]) => v)
                    .map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url!.startsWith('http') ? url! : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2.5 py-1 bg-secondary rounded text-xs font-medium text-primary hover:underline capitalize"
                      >
                        {platform}
                      </a>
                    ))}
                </div>
              </div>

              {/* Bio */}
              {detailApp.content_bio && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Content Bio</p>
                  <p className="text-foreground/80 leading-relaxed">{detailApp.content_bio}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Applied: {format(new Date(detailApp.created_at), 'MMM d, yyyy h:mm a')}
              </div>

              {/* Action buttons */}
              {detailApp.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => onCreatorAction(detailApp.id, 'approved')}>
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => onCreatorAction(detailApp.id, 'rejected')}>
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApplicationsTab;
