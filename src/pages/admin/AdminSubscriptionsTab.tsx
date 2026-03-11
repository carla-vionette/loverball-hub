import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { fetchAllSubscriptions } from '@/services/subscriptionService';
import { format } from 'date-fns';
import type { Subscription } from '@/types';

const AdminSubscriptionsTab = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSubscriptions()
      .then(setSubscriptions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600';
      case 'past_due': return 'bg-yellow-500/10 text-yellow-600';
      case 'canceled': return 'bg-red-500/10 text-red-600';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-purple-500/10 text-purple-600';
      case 'pro': return 'bg-primary/10 text-primary';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <section>
      <h2 className="font-display text-xl font-bold uppercase mb-4">
        Subscriptions ({subscriptions.length})
      </h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {subscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">User ID</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Plan</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Period End</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="text-sm font-mono text-muted-foreground max-w-[150px] truncate">
                      {sub.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge className={planColor(sub.plan)}>{sub.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor(sub.status)}>{sub.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.current_period_end
                        ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sub.created_at), 'MMM d, yyyy')}
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
