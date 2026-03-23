import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { direction: 'up' | 'down'; text: string };
}

const KpiCard = ({ label, value, icon: Icon, trend }: KpiCardProps) => (
  <div className="bg-card border border-border/20 rounded-[20px] p-6 transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
    <div className="flex items-center gap-3 mb-3">
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </div>
    <p className="font-display text-3xl font-bold text-foreground leading-none tabular-nums">
      {value}
    </p>
    {trend && (
      <p className={`text-xs font-semibold mt-3 ${trend.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
        {trend.text}
      </p>
    )}
  </div>
);

export default KpiCard;
