import { useEffect, useState } from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getBetaTrialStatus, getUserSubscription, BETA_TRIAL_DAYS, PERMANENT_ACCESS_EMAILS } from '@/services/subscriptionService';
import UpgradeModal from './UpgradeModal';

interface BetaTrialBannerProps {
  className?: string;
}

const BetaTrialBanner = ({ className = '' }: BetaTrialBannerProps) => {
  const { user } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [inTrial, setInTrial] = useState(false);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [trial, sub] = await Promise.all([
        getBetaTrialStatus(user.id),
        getUserSubscription(user.id).catch(() => null),
      ]);
      setInTrial(trial.inTrial);
      setDaysRemaining(trial.daysRemaining);
      setHasPaidPlan(!!sub && sub.status === 'active' && sub.plan !== 'free');
    })();
  }, [user]);

  const email = user?.email?.toLowerCase();
  const isPermanent = !!email && PERMANENT_ACCESS_EMAILS.includes(email);
  if (!user || isPermanent || hasPaidPlan || daysRemaining === null) return null;

  const expired = !inTrial;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowUpgrade(true)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm text-left transition-colors ${
          expired
            ? 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20 text-foreground'
            : 'bg-primary/10 border-primary/20 hover:bg-primary/15 text-foreground'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expired ? (
            <Clock className="w-4 h-4 flex-shrink-0 text-destructive" />
          ) : (
            <Sparkles className="w-4 h-4 flex-shrink-0 text-primary" />
          )}
          <span className="truncate">
            {expired ? (
              <>Your {BETA_TRIAL_DAYS}-day beta trial has ended. Upgrade to keep full access.</>
            ) : (
              <>
                <span className="font-semibold">Beta:</span>{' '}
                {daysRemaining} day{daysRemaining === 1 ? '' : 's'} of full access left
              </>
            )}
          </span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide flex-shrink-0">
          {expired ? 'Upgrade' : 'Plans'}
        </span>
      </button>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} requiredTier="digital" />
    </>
  );
};

export default BetaTrialBanner;
