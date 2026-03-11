import { INVITE_MILESTONES } from '@/types';

interface InviteBadgeProps {
  count: number;
  size?: 'sm' | 'md';
}

const InviteBadge = ({ count, size = 'md' }: InviteBadgeProps) => {
  // Find the highest milestone reached
  const milestone = [...INVITE_MILESTONES]
    .reverse()
    .find((m) => count >= m.threshold);

  if (!milestone) return null;

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
        {milestone.emoji}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
      <span className="text-lg">{milestone.emoji}</span>
      <span className="text-sm font-semibold">{milestone.label}</span>
    </div>
  );
};

export default InviteBadge;
