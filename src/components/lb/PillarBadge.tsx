import type { Pillar } from '@/lib/lb';

export default function PillarBadge({ pillar }: { pillar: Pillar }) {
  return (
    <span className="eyebrow text-primary">{pillar}</span>
  );
}
