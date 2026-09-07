import React from 'react';

export function ViewButton({ active, icon, label, onClick }: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold transition ${
        active
          ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
      }`}
    >
      {icon}{label}
    </button>
  );
}