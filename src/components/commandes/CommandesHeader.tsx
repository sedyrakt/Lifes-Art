

import React from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CommandesHeaderProps {
  onAddCommande: () => void;
  onOpenStats: () => void;
  totalItems?: number;
  refreshing?: boolean;
}

const CommandesHeader: React.FC<CommandesHeaderProps> = ({
  onAddCommande,
  totalItems,
  refreshing = false,
}) => {
  const { isDark } = useTheme();

  return (
    <header className="mb-4 w-full">
      <div
        className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 md:flex-row md:items-center md:justify-between dark:bg-[#0F172A]"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' }}
      >
        <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

        <div className="relative z-10 flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">
              Commandes
            </h1>
            {totalItems !== undefined && (
              <span className="inline-flex min-w-[26px] items-center justify-center rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-brand-500 dark:text-white">
                {totalItems}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">
            Suivez et gérez vos commandes en temps réel.
          </p>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">
          <button
            type="button"
            onClick={onAddCommande}
            className="inline-flex h-9 flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-600 dark:focus:ring-offset-[#0F172A]"
            aria-label="Créer une nouvelle commande"
          >
            <Plus size={17} strokeWidth={2.2} />
            <span>Nouvelle commande</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default CommandesHeader;