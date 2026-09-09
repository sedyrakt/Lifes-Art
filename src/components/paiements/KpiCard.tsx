import React from 'react';

export function KpiCard({ label, value, icon, colorClass }: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/[0.1] dark:bg-[#0F172A] flex items-center gap-3">
      {icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass || 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
 
        <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 truncate text-[18px] font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}