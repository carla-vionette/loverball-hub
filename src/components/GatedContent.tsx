import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserTier, canAccessTier } from '@/services/subscriptionService';
import UpgradeModal from '@/components/UpgradeModal';
import type { ContentTier, SubscriptionPlan } from '@/types';

interface GatedContentProps {
  children: ReactNode;
  requiredTier: ContentTier;
  fallback?: ReactNode;
}

const GatedContent = ({ children, requiredTier, fallback }: GatedContentProps) => {
  const { user } = useAuth();
  const [userTier, setUserTier] = useState<SubscriptionPlan>('free');
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (user) {
      getUserTier(user.id).then((tier) => {
        setUserTier(tier);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return null;

  if (!canAccessTier(userTier, requiredTier)) {
    return (
      <>
        {fallback || (
          <div
            className="relative cursor-pointer"
            onClick={() => setShowUpgrade(true)}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center p-6">
                <p className="font-display text-lg font-bold uppercase mb-2">
                  {requiredTier === 'premium' ? 'Premium' : 'Pro'} Content
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Upgrade to access this content
                </p>
                <span className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
                  Upgrade Now
                </span>
              </div>
            </div>
            <div className="opacity-30 pointer-events-none">{children}</div>
          </div>
        )}
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} requiredTier={requiredTier} />
      </>
    );
  }

  return <>{children}</>;
};

export default GatedContent;
