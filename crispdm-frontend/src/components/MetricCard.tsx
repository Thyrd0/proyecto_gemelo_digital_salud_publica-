import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  variant?: 'default' | 'accent' | 'warning' | 'emerald';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeColor = 'bg-slate-800 text-slate-300 border-slate-700',
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-slate-900/70 border-slate-800',
    accent: 'bg-slate-900/80 border-turquoise-500/40 shadow-sm shadow-turquoise-500/5',
    warning: 'bg-amber-950/20 border-amber-500/30',
    emerald: 'bg-emerald-950/20 border-emerald-500/30'
  };

  return (
    <div className={`p-4 rounded-xl border ${variantStyles[variant]} transition-all backdrop-blur-sm`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && <span className="text-turquoise-400">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          {value}
        </span>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-1 leading-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
