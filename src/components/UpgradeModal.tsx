import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { SubscriptionPlan } from '@/types';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTier?: string;
}

const UpgradeModal = ({ open, onOpenChange, requiredTier = 'pro' }: UpgradeModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(plan);
    try {
      const url = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase">Upgrade Required</DialogTitle>
          <DialogDescription>
            This content requires a {requiredTier} plan or higher. Choose a plan to unlock access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {requiredTier !== 'premium' && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">$9.99/month</p>
                </div>
                <Button size="sm" onClick={() => handleUpgrade('pro')} disabled={!!loading}>
                  {loading === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
                </Button>
              </div>
              <ul className="space-y-1">
                {['Full video library', 'All events', 'Member dashboard'].map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border rounded-lg p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">Premium Plan</p>
                <p className="text-sm text-muted-foreground">$19.99/month</p>
              </div>
              <Button size="sm" onClick={() => handleUpgrade('premium')} disabled={!!loading}>
                {loading === 'premium' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
              </Button>
            </div>
            <ul className="space-y-1">
              {['Everything in Pro', 'Exclusive events', 'Early access', 'VIP features'].map((f) => (
                <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
