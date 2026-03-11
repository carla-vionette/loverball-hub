import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Phone, Instagram, Linkedin, Globe, Download, Trash2, UserX } from 'lucide-react';
import { format } from 'date-fns';
import type { UserProfile } from '@/types';
import { exportMembersToCSV, deleteMember, suspendMember } from '@/services/adminService';

interface Props {
  members: UserProfile[];
  onRefresh: () => void;
}

const AdminMembersTab = ({ members, onRefresh }: Props) => {
  const { toast } = useToast();
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'suspend'; member: UserProfile } | null>(null);

  const handleExport = () => {
    exportMembersToCSV(members);
    toast({ title: 'Members CSV downloaded!' });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'delete') {
        await deleteMember(confirmAction.member.id);
        toast({ title: `Deleted ${confirmAction.member.name}` });
      } else {
        await suspendMember(confirmAction.member.id);
        toast({ title: `Suspended ${confirmAction.member.name}` });
      }
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold uppercase">All Members ({members.length})</h2>
        <Button variant="outline" onClick={handleExport} disabled={members.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {members.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Email</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Location</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Social</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {member.profile_photo_url ? (
                          <img src={member.profile_photo_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">{member.name}</p>
                          {member.primary_role && <p className="text-xs text-muted-foreground">{member.primary_role}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.email || '-'}</TableCell>
                    <TableCell className="text-sm">{member.city || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(member.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {member.instagram_url && (
                          <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {member.linkedin_url && (
                          <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {member.website_url && (
                          <a href={member.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmAction({ type: 'suspend', member })}
                          title="Suspend member"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmAction({ type: 'delete', member })}
                          title="Delete member"
                        >
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
          <p className="text-muted-foreground text-center py-12">No members yet</p>
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete' ? 'Delete Member' : 'Suspend Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction?.type} {confirmAction?.member.name}?
              {confirmAction?.type === 'delete' && ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirmAction?.type === 'delete' ? 'Delete' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default AdminMembersTab;
