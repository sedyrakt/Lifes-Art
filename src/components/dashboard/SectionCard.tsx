// src/components/dashboard/SectionCard.tsx
import React from 'react';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ children, className = '' }) => (
  <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.08] dark:bg-[#0F172A] dark:shadow-[0_12px_40px_rgba(0,0,0,0.18)] ${className}`}>
    {children}
  </div>
);