interface InviteBadgeProps {
  label: string;
  emoji: string;
  size?: 'sm' | 'md';
}

const InviteBadge = ({ label, emoji, size = 'md' }: InviteBadgeProps) => {
  const sizeClasses = size === 'sm'
    ? 'text-sm px-2 py-0.5'
    : 'text-base px-3 py-1';

  return (
    <div className={`inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full font-semibold ${sizeClasses}`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
};

export default InviteBadge;
