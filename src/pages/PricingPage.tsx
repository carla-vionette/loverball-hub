import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createCheckoutSession } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionPlan } from '@/types';

const plans = [
  {
    id: 'free' as SubscriptionPlan,
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with Loverball',
    features: [
      '3 videos per month',
      'Community access',
      'Basic event listings',
      'Member profile',
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    id: 'pro' as SubscriptionPlan,
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'Full access for serious fans',
    features: [
      'Unlimited video library',
      'All events access',
      'Full member dashboard',
      'Priority RSVPs',
      'Invite tracking',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: 'premium' as SubscriptionPlan,
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    description: 'The ultimate experience',
    features: [
      'Everything in Pro',
      'Exclusive events',
      'Early access content',
      'VIP community features',
      'Direct messaging',
      'Premium badge',
    ],
    cta: 'Go Premium',
    popular: false,
  },
];

const PricingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (plan === 'free') return;

    setLoadingPlan(plan);
    try {
      const url = await createCheckoutSession(plan);
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
            Unlock the full Loverball experience with a plan that fits your game.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                plan.popular ? 'border-primary shadow-md ring-2 ring-primary/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl uppercase">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={plan.id === 'free' || loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {plan.cta}
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
