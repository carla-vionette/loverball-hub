import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { direction: 'up' | 'down'; text: string };
}

const KpiCard = ({ label, value, icon: Icon, trend }: KpiCardProps) => (
  <div className="bg-card border border-border/20 rounded-xl p-5 shadow-sm">
    <div className="flex items-center gap-3 mb-2">
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
    <p className="font-display text-3xl font-bold text-foreground leading-none tabular-nums">
      {value}
    </p>
    {trend && (
      <p className={`text-xs font-semibold mt-2 ${trend.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
        {trend.text}
      </p>
    )}
  </div>
);

export default KpiCard;
