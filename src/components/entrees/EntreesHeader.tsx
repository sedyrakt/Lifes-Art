// src/components/entrees/EntreesHeader.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EntreesHeaderProps {
  onAddEntree: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  totalItems?: number;
}

const EntreesHeader: React.FC<EntreesHeaderProps> = ({ onAddEntree, refreshing = false, onRefresh, totalItems }) => {
  const { isDark } = useTheme();

  return (
    <header className="relative mb-4 w-full overflow-hidden rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:bg-slate-900 dark:border-white/[0.12]">
      <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />
      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col">
          <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">
            Entrées de stock
          </h1>
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">
            Gérez les entrées (Production, Retour, Ajustement)
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-brand-600 dark:border-white/[0.12] dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}
          <button
            type="button"
            onClick={onAddEntree}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md"
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Nouvelle entrée</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default EntreesHeader;