import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import { PLANS, type ContentTier, type SubscriptionPlan } from '@/types';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier?: ContentTier;
}

const UpgradeModal = ({ open, onOpenChange, requiredTier = 'pro' }: UpgradeModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);

  const plansToShow = PLANS.filter((p) => p.price > 0);

  const handleUpgrade = async (planId: SubscriptionPlan) => {
    if (!user) {
      onOpenChange(false);
      navigate('/auth?redirect=/pricing');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl uppercase">
            <Crown className="w-5 h-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          This content requires a {requiredTier === 'premium' ? 'Premium' : 'Pro'} subscription.
        </p>
        <div className="space-y-4">
          {plansToShow.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-xl p-4 transition-colors ${
                plan.id === requiredTier ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{plan.name}</h3>
                <span className="font-bold text-lg">${plan.price}/mo</span>
              </div>
              <ul className="space-y-1 mb-3">
                {plan.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.id === requiredTier ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleUpgrade(plan.id)}
                disabled={loadingPlan === plan.id}
              >
                {loadingPlan === plan.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Choose {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
