import type { SubscriptionPlan } from '@/types';

interface MemberBadgeProps {
  tier: SubscriptionPlan | string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MemberBadge = ({ tier, size = 'sm', className = '' }: MemberBadgeProps) => {
  if (!tier || tier === 'free') return null;

  const emoji = tier === 'allaccess' ? '💎' : '⚡';
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} ${className}`} title={tier === 'allaccess' ? 'All Access Member' : 'Community Member'}>
      {emoji}
    </span>
  );
};

export default MemberBadge;
