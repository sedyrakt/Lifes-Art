// src/components/dashboard/SectionHeading.tsx
import React from 'react';

interface SectionHeadingProps {
  title: string;
  accent?: 'brand' | 'emerald';
  subtitle?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, accent = 'brand', subtitle }) => {
  const isEmerald = accent === 'emerald';

  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isEmerald ? 'bg-emerald-500' : 'bg-brand-500'}`} />
      <h2 className={`text-[11px] font-bold uppercase tracking-[0.12em] ${isEmerald ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'}`}>
        {title}
      </h2>
      {subtitle && (
        <span className="text-[10.5px] text-slate-400 dark:text-slate-500">· {subtitle}</span>
      )}
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.08]" />
    </div>
  );
};