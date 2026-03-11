import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserSubscription } from '@/services/subscriptionService';
import type { Subscription } from '@/types';

const BillingPage = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserSubscription(user.id)
      .then(setSubscription)
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const plan = subscription?.plan || 'free';
  const status = subscription?.status || 'active';
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-8">
          Billing & Subscription
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Current Plan
              </CardTitle>
              <Badge
                variant={status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold capitalize">{plan}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {plan === 'free'
                    ? 'Limited access — upgrade for more'
                    : plan === 'pro'
                    ? '$9.99/month — Full video & event access'
                    : '$19.99/month — Premium experience'}
                </p>
                {periodEnd && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Current period ends: {periodEnd}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          {plan === 'free' && (
            <Link to="/pricing">
              <Button>
                Upgrade Plan <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
          {plan !== 'free' && (
            <Link to="/pricing">
              <Button variant="outline">Change Plan</Button>
            </Link>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BillingPage;
