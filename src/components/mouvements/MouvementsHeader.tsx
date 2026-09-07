
import React from 'react';
import { Printer, Download, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface MouvementsHeaderProps {
  onPrint: () => void;
  onExport: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  totalItems?: number;
}

const MouvementsHeader: React.FC<MouvementsHeaderProps> = ({ onPrint, onExport, refreshing = false, onRefresh, totalItems }) => {
  const { isDark } = useTheme();

  return (
    <header className="mb-4 w-full">
      <div
        className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 md:flex-row md:items-center md:justify-between dark:bg-slate-900"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
      >
        <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

        <div className="relative z-10 flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">
              Mouvements de stock
            </h1>
            {totalItems !== undefined && (
              <span className="inline-flex min-w-[26px] items-center justify-center rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">
            Suivez les entrées, sorties et ajustements.
          </p>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border px-3 text-[13px] font-medium text-slate-500 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', background: isDark ? 'bg-slate-900' : '#FFFFFF' }}
              aria-label="Actualiser les mouvements"
              title="Actualiser"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-9 flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-600 dark:focus:ring-offset-slate-900"
            aria-label="Exporter les mouvements"
            title="Exporter"
          >
            <Download size={16} />
            <span>Exporter</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default MouvementsHeader;