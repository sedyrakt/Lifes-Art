import React from 'react';

export function FilterSelect({ label, value, onChange, children }: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* ⭐ Nohavaozina ny label mba hifanaraka tsara */}
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-500 dark:text-slate-400">{label}</label>
      
      {/* ⭐ Nohavaozina ny background sy ny dropdown options */}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[14px] text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-100 dark:hover:border-white/[0.18] dark:[&>option]:bg-[#0F172A]"
      >
        {children}
      </select>
    </div>
  );
}