import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { fetchUserSubscription } from '@/services/subscriptionService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { Subscription } from '@/types';

const BillingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserSubscription(user.id)
        .then(setSubscription)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free';

  const statusColor =
    subscription?.status === 'active'
      ? 'bg-green-500/10 text-green-600'
      : subscription?.status === 'past_due'
        ? 'bg-yellow-500/10 text-yellow-600'
        : 'bg-secondary text-muted-foreground';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-8">
          Billing
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{planLabel}</p>
                {subscription?.plan !== 'free' && (
                  <p className="text-sm text-muted-foreground">
                    ${subscription?.plan === 'pro' ? '9.99' : '19.99'}/month
                  </p>
                )}
              </div>
              <Badge className={statusColor}>
                {subscription?.status || 'active'}
              </Badge>
            </div>

            {subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Current period ends: {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              {subscription?.plan === 'free' ? (
                <Button onClick={() => navigate('/pricing')}>
                  Upgrade Plan
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default BillingPage;
