import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface FournisseursHeaderProps {
  onAddFournisseur: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  totalItems?: number;
}

const FournisseursHeader: React.FC<FournisseursHeaderProps> = ({
  onAddFournisseur,
  refreshing = false,
  onRefresh,
  isLoading = false,
  totalItems,
}) => {
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <header className="mb-4 w-full">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.12] dark:bg-slate-900">
          <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-slate-50/70 to-transparent dark:via-white/[0.05]" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col">
              <div className="h-5 w-40 rounded-md bg-slate-200 dark:bg-white/[0.08]" />
              <div className="mt-1.5 h-3.5 w-64 rounded-md bg-slate-200 dark:bg-white/[0.08]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
              <div className="h-9 w-40 rounded-lg bg-slate-200 dark:bg-white/[0.08]" />
            </div>
          </div>
        </div>
        <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
      </header>
    );
  }

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
              Fournisseurs
            </h1>
            {totalItems !== undefined && (
              <span className="inline-flex min-w-[26px] items-center justify-center rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-brand-500 dark:text-white">
                {totalItems}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">
            Gérez vos fournisseurs et leurs informations.
          </p>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border px-3 text-[13px] font-medium text-slate-500 transition-all duration-150 hover:border-brand-500/20 hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', background: isDark ? '#1E293B' : '#FFFFFF' }}
              aria-label="Actualiser les fournisseurs"
              title="Actualiser"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={onAddFournisseur}
            className="inline-flex h-9 flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-600 dark:focus:ring-offset-slate-900"
            aria-label="Ajouter un fournisseur"
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Nouveau fournisseur</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default FournisseursHeader;