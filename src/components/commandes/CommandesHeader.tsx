// src/components/commandes/CommandesHeader.tsx
import React, { useCallback } from 'react';
import { Plus, RefreshCw, FileText, Users } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CommandesHeaderProps {
  onAddCommande: () => void;
  onOpenStats?: () => void;
  totalItems?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  isDark?: boolean;
}

const CommandesHeader: React.FC<CommandesHeaderProps> = ({
  onAddCommande,
  onOpenStats,
  totalItems = 0,
  refreshing = false,
  onRefresh,
  isDark: propIsDark,
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;

  const handleRefresh = useCallback(() => {
    if (onRefresh && !refreshing) onRefresh();
  }, [onRefresh, refreshing]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Titre et sous-titre */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">
            Commandes
          </h1>
          {totalItems > 0 && (
            <span className="inline-flex items-center rounded-full bg-brand-500 px-2 py-0.5 text-[12px] font-bold text-white">
              {totalItems}
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Suivez et gérez vos commandes en temps réel.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Actualiser"
            aria-label="Actualiser les commandes"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}
        {onOpenStats && (
          <button
            type="button"
            onClick={onOpenStats}
            title="Statistiques"
            aria-label="Voir les statistiques"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-white/[0.12] dark:bg-[#0F172A] dark:text-slate-400 dark:hover:bg-white/[0.06]"
          >
            <FileText size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onAddCommande}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98]"
        >
          <Plus size={16} />
          Nouvelle commande
        </button>
      </div>
    </div>
  );
};

export default CommandesHeader;