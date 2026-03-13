import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LockedFeatureProps {
  children: ReactNode;
  requiredTier: 'community' | 'allaccess';
  userTier: string | null;
  message?: string;
}

const LockedFeature = ({ children, requiredTier, userTier, message }: LockedFeatureProps) => {
  const navigate = useNavigate();
  const tierRank: Record<string, number> = { free: 0, community: 1, allaccess: 2 };
  const hasAccess = (tierRank[userTier || 'free'] || 0) >= (tierRank[requiredTier] || 0);

  if (hasAccess) return <>{children}</>;

  const tierLabel = requiredTier === 'allaccess' ? 'All Access' : 'Community';
  const tierPrice = requiredTier === 'allaccess' ? '$35' : '$15';
  const defaultMessage = `Unlock with ${tierLabel} — ${tierPrice}/mo`;

  return (
    <div className="relative">
      <div className="blur-sm opacity-40 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl">
        <Lock className="w-6 h-6 text-muted-foreground mb-2" />
        <p className="text-sm font-semibold text-foreground mb-1">{message || defaultMessage}</p>
        <Button
          size="sm"
          className="rounded-full mt-2 text-xs"
          onClick={() => navigate('/membership')}
        >
          Go Member
        </Button>
      </div>
    </div>
  );
};

export default LockedFeature;
