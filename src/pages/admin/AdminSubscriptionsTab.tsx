import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchAllSubscriptions, updateSubscriptionPlan, cancelSubscription } from '@/services/subscriptionService';
import type { SubscriptionWithUser, SubscriptionPlan } from '@/types';
import { format } from 'date-fns';

const AdminSubscriptionsTab = () => {
  const { toast } = useToast();
  const [subs, setSubs] = useState<SubscriptionWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllSubscriptions();
      setSubs(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePlanChange = async (subId: string, plan: SubscriptionPlan) => {
    try {
      await updateSubscriptionPlan(subId, plan);
      toast({ title: `Plan updated to ${plan}` });
      load();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleCancel = async (subId: string) => {
    try {
      await cancelSubscription(subId);
      toast({ title: 'Subscription canceled' });
      load();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-display text-xl font-bold uppercase mb-4">Subscriptions ({subs.length})</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {subs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">User</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Plan</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Period End</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="font-semibold">{sub.user_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Select
                        value={sub.plan}
                        onValueChange={(v) => handlePlanChange(sub.id, v as SubscriptionPlan)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="digital">All Access</SelectItem>
                          <SelectItem value="local">The Club</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sub.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize text-xs"
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.current_period_end
                        ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {sub.status === 'active' && sub.plan !== 'free' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive text-xs"
                          onClick={() => handleCancel(sub.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No subscriptions yet.</p>
        )}
      </div>
    </section>
  );
};

export default AdminSubscriptionsTab;
