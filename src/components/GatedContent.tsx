import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserTier, canAccessTier } from '@/services/subscriptionService';
import UpgradeModal from '@/components/UpgradeModal';
import { Lock } from 'lucide-react';
import type { SubscriptionPlan } from '@/types';

interface GatedContentProps {
  children: ReactNode;
  requiredTier: string;
  fallback?: ReactNode;
}

const GatedContent = ({ children, requiredTier, fallback }: GatedContentProps) => {
  const { user } = useAuth();
  const [userTier, setUserTier] = useState<SubscriptionPlan>('free');
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getUserTier(user.id)
      .then(setUserTier)
      .catch(() => setUserTier('free'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return null;

  if (canAccessTier(userTier, requiredTier)) {
    return <>{children}</>;
  }

  if (fallback) {
    return (
      <>
        {fallback}
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} requiredTier={requiredTier} />
      </>
    );
  }

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setShowUpgrade(true)}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">
              {requiredTier === 'premium' ? 'Premium' : 'Pro'} Content
            </p>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">
              Click to upgrade
            </p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">{children}</div>
      </div>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} requiredTier={requiredTier} />
    </>
  );
};

export default GatedContent;
