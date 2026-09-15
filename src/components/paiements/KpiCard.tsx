import React from 'react';

export function KpiCard({ label, value, icon, colorClass }: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(79,70,229,0.03)] transition-all duration-200 hover:border-brand-500/40 hover:bg-brand-50/20 dark:border-white/[0.12] dark:bg-[#0F172A] dark:hover:border-white/[0.18] dark:hover:bg-slate-800">
      {icon && (
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass || 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="min-w-0 truncate text-[13.5px] font-medium leading-[1.3] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 min-w-0 truncate text-[16.5px] font-semibold leading-[1.25] tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}