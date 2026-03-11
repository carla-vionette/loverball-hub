import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession } from '@/services/subscriptionService';
import { PLANS, type SubscriptionPlan } from '@/types';

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);

  const handleSelectPlan = async (planId: SubscriptionPlan) => {
    if (!user) {
      navigate('/auth?redirect=/pricing');
      return;
    }
    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }
    setLoadingPlan(planId);
    try {
      const url = await createCheckoutSession(planId);
      window.location.href = url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Unlock the full Loverball experience. Upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-200 ${
                plan.highlighted
                  ? 'border-primary shadow-lg scale-[1.02]'
                  : 'hover:shadow-md'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              <CardHeader className={plan.highlighted ? 'pt-10' : ''}>
                <CardTitle className="font-display text-2xl uppercase">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm">/{plan.interval}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {plan.price === 0 ? 'Get Started' : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default PricingPage;
