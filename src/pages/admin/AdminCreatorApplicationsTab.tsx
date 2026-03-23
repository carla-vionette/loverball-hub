import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { CreatorApplication, SocialLinks } from '@/types';
import { handleCreatorApplication } from '@/services/adminService';

interface Props {
  applications: CreatorApplication[];
  reviewerId: string;
  onRefresh: () => void;
}

const SocialLinksDisplay = ({ links }: { links: SocialLinks }) => {
  const entries = Object.entries(links).filter(([, v]) => v);
  if (entries.length === 0) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([platform, url]) => (
        <a
          key={platform}
          href={url?.startsWith('http') ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {platform}
          <ExternalLink className="w-3 h-3" />
        </a>
      ))}
    </div>
  );
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-destructive/10 text-destructive',
};

const AdminCreatorApplicationsTab = ({ applications, reviewerId, onRefresh }: Props) => {
  const { toast } = useToast();
  const [detailApp, setDetailApp] = useState<CreatorApplication | null>(null);

  const onAction = async (appId: string, action: 'approved' | 'rejected') => {
    try {
      await handleCreatorApplication(appId, action, reviewerId);
      toast({ title: `Application ${action}` });
      setDetailApp(null);
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const pendingApps = applications.filter(a => a.status === 'pending');
  const otherApps = applications.filter(a => a.status !== 'pending');

  return (
    <section className="space-y-8">
      {/* Pending Applications */}
      <div>
        <h2 className="font-display text-xl font-bold uppercase mb-4">
          Pending Creator/Team/Org Applications
          {pendingApps.length > 0 && (
            <Badge variant="destructive" className="ml-3 text-xs">
              {pendingApps.length}
            </Badge>
          )}
        </h2>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {pendingApps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Applicant</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Email</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Socials</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApps.map((app) => (
                  <TableRow key={app.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          {app.profile_photo_url ? (
                            <AvatarImage src={app.profile_photo_url} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {(app.applicant_name || '?')[0].toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="font-semibold text-sm">{app.applicant_name || app.org_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {app.account_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{app.official_email}</TableCell>
                    <TableCell>
                      <SocialLinksDisplay links={app.social_links} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(app.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => setDetailApp(app)} title="View details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => onAction(app.id, 'approved')}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => onAction(app.id, 'rejected')}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-12">No pending applications</p>
          )}
        </div>
      </div>

      {/* Past Applications */}
      {otherApps.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold uppercase mb-3">Past Applications</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Applicant</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherApps.map((app) => (
                  <TableRow key={app.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold text-sm">{app.applicant_name || app.org_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">{app.account_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${statusColors[app.status] || ''}`}>
                        {app.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(app.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setDetailApp(app)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailApp} onOpenChange={(open) => !open && setDetailApp(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {detailApp && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  {detailApp.profile_photo_url ? (
                    <AvatarImage src={detailApp.profile_photo_url} />
                  ) : (
                    <AvatarFallback>
                      {(detailApp.applicant_name || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold">{detailApp.applicant_name || 'Unknown'}</h3>
                  <Badge variant="outline" className="capitalize text-xs">{detailApp.account_type}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Email</p>
                  <p>{detailApp.official_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Phone</p>
                  <p>{detailApp.phone_number}</p>
                </div>
                {detailApp.org_name && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                      {detailApp.account_type === 'team' ? 'Team Name' : 'Organization Name'}
                    </p>
                    <p>{detailApp.org_name}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Social Media</p>
                <SocialLinksDisplay links={detailApp.social_links} />
              </div>

              {detailApp.content_bio && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Bio / Content Description</p>
                  <p className="text-sm text-foreground/80">{detailApp.content_bio}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${statusColors[detailApp.status] || ''}`}>
                  {detailApp.status}
                </span>
              </div>

              {detailApp.status === 'pending' && (
                <div className="flex gap-3 pt-2 border-t border-border">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onAction(detailApp.id, 'approved')}>
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => onAction(detailApp.id, 'rejected')}>
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AdminCreatorApplicationsTab;
