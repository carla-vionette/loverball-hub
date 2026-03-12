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

const UpgradeModal = ({ open, onOpenChange, requiredTier = 'digital' }: UpgradeModalProps) => {
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
          {requiredTier !== 'local' && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">All Access</p>
                  <p className="text-sm text-muted-foreground">$15/month</p>
                </div>
                <Button size="sm" onClick={() => handleUpgrade('digital')} disabled={!!loading}>
                  {loading === 'digital' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
                </Button>
              </div>
              <ul className="space-y-1">
                {['No ads', 'Full content library', 'Full digital community'].map((f) => (
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
                <p className="font-semibold">The Club</p>
                <p className="text-sm text-muted-foreground">$35/month</p>
              </div>
              <Button size="sm" onClick={() => handleUpgrade('local')} disabled={!!loading}>
                {loading === 'local' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
              </Button>
            </div>
            <ul className="space-y-1">
              {['Everything in All Access', 'IRL events access', 'Local networking', 'Exclusive perks'].map((f) => (
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
