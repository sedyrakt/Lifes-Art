// src/pages/commandes/OverdueBanner.tsx
import React from 'react';
import { Eye, ChevronRight } from 'lucide-react';

interface OverdueBannerProps {
  isDark: boolean;
  overdueCount: number;
  overdueTotal: number;
  onClick: () => void;
}

export const OverdueBanner: React.FC<OverdueBannerProps> = ({
  isDark, overdueCount, overdueTotal, onClick,
}) => {
  if (overdueCount <= 0) return null;

  const formatMoney = (v: number) => `${Number(v || 0).toLocaleString('fr-FR')} Ar`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-[1px]"
      style={{
        background: isDark ? 'rgba(239,68,68,0.06)' : '#FEF2F2',
        borderColor: isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.30)',
        boxShadow: isDark
          ? '0 4px 18px -6px rgba(239,68,68,0.25)'
          : '0 4px 14px -6px rgba(239,68,68,0.18)',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <p
            className="text-[14px] font-bold leading-tight"
            style={{ color: isDark ? '#FCA5A5' : '#B91C1C' }}
          >
            {overdueCount} échéance{overdueCount > 1 ? 's' : ''} dépassée{overdueCount > 1 ? 's' : ''}
          </p>
          <p
            className="mt-0.5 truncate text-[12.5px] leading-tight"
            style={{ color: isDark ? '#F87171' : '#DC2626' }}
          >
            Total dû : <strong>{formatMoney(overdueTotal)}</strong> — Cliquez pour voir les détails
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[12.5px] font-semibold text-red-600 transition group-hover:bg-red-500/20 dark:text-red-400">
        <Eye size={13} />
        Voir
        <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};