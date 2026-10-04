import React from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
  badgeVariant?: "emerald" | "amber" | "sky" | "slate";
  isLoading?: boolean;
  isLive?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-emerald-600 dark:text-emerald-400",
  iconBg = "bg-emerald-50 dark:bg-emerald-950/50",
  badge,
  badgeVariant = "slate",
  isLoading = false,
  isLive = false,
}: MetricCardProps) {
  const badgeColors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    sky: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={`${title}: ${value}`}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/90 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isLive && (
            <span className="relative flex h-2 w-2 shrink-0" title="Live update">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </span>
        </div>
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-800 transition-transform duration-200 group-hover:scale-105",
            iconBg
          )}
        >
          <Icon size={20} weight="duotone" className={iconColor} />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
          {value}
        </div>
        {badge && (
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0",
              badgeColors[badgeVariant]
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default MetricCard;
