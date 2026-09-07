import React from 'react';

export function FilterSelect({ label, value, onChange, children }: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-semibold text-slate-500 dark:text-slate-400">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[14px] text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-slate-800 dark:text-slate-200"
      >
        {children}
      </select>
    </div>
  );
}