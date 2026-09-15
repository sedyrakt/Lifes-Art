// src/components/paiements/PaiementsHeader.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur DashboardHeader, ProduitsHeader, CategoriesHeader, EntreesHeader, EmployesHeader
// ⭐ FONT SIZE: h1 20px, subtitle 13px, buttons 14px
// ⭐ FIX #6 : Bouton "Paramètres (globaux)" — mazava ny dikan'ny

import React from 'react';
import { Plus, RefreshCw, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type PayrollMode = 'complet' | 'simplifie';

interface PaiementsHeaderProps {
  onAddPaiement: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  totalItems?: number;
  onOpenParametresPaie?: () => void;
  payrollMode?: PayrollMode;
}

const PaiementsHeader: React.FC<PaiementsHeaderProps> = ({
  onAddPaiement,
  refreshing = false,
  onRefresh,
  totalItems,
  onOpenParametresPaie,
  payrollMode = 'complet',
}) => {
  const { isDark } = useTheme();
  const borderColor = isDark ? 'border-white/[0.12]' : 'border-slate-200';
  const isSimplifie = payrollMode === 'simplifie';

  return (
    <header className="mb-4 w-full">
      <div
        className={`group relative flex flex-col gap-3 rounded-xl border-[0.5px] shadow-sm transition-colors duration-200 md:flex-row md:items-center md:justify-between px-3 py-2.5 ${
          isDark ? 'bg-[#0F172A]' : 'bg-white'
        } ${borderColor}`}
      >
        <div className="absolute left-0 top-0 h-full w-[2px] bg-brand-500" />

        {/* ═══ Titre + Compteur ═══ */}
        <div className="relative z-10 flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            {/* ⭐ h1 : 18px → 20px */}
            <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100">
              Paiements
            </h1>
            {totalItems !== undefined && (
              // ⭐ Badge : 11.5px → 12.5px, min-w 24 → 26
              <span className="inline-flex min-w-[26px] items-center justify-center rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[12.5px] font-semibold leading-tight text-brand-600 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-400">
                {totalItems}
              </span>
            )}

            {isSimplifie && (
              // ⭐ Badge SIMPLE : 10.5px → 11px
              <span
                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                title="Mode Simplifié activé"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                SIMPLE
              </span>
            )}
          </div>
          {/* ⭐ Subtitle : 12.5px → 13px */}
          <p className="mt-0.5 text-[13px] font-medium leading-tight text-slate-500 dark:text-slate-400">
            Suivez les paiements et rémunérations des employés.
          </p>
        </div>

        {/* ═══ Boutons ═══ */}
        <div className="relative z-10 flex w-full shrink-0 items-center gap-2 md:w-auto">

          {/* ⭐ FIX #6 : Bouton "Paramètres (globaux)" */}
          {onOpenParametresPaie && (
            <button
              type="button"
              onClick={onOpenParametresPaie}
              title={`Configuration globale de la paie (CNaPS, OSTIE, IRSA) — Mode actuel : ${isSimplifie ? 'Simplifié' : 'Complet'}`}
              aria-label="Paramètres de paie (globaux)"
              /* ⭐ Button text : 12.5px → 14px */
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[14px] font-medium text-slate-600 transition-colors hover:border-brand-500/20 hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 ${borderColor} ${
                isDark ? 'bg-[#0F172A]' : 'bg-white'
              }`}
            >
              {/* ⭐ Icon : 14 → 15 */}
              <Settings size={15} strokeWidth={2.2} />
              <span className="hidden sm:inline">Paramètres</span>
              {/* ⭐ "(globaux)" : 10px → 11px */}
              <span className="hidden text-[11px] opacity-60 lg:inline">(globaux)</span>
              {isSimplifie && (
                // ⭐ "Simple" badge : 9.5px → 10.5px
                <span className="hidden rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 md:inline-block dark:bg-emerald-500/15 dark:text-emerald-300">
                  Simple
                </span>
              )}
            </button>
          )}

          {/* Bouton Refresh */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-500 transition-colors hover:border-brand-500/20 hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 ${borderColor} ${
                isDark ? 'bg-[#0F172A]' : 'bg-white'
              }`}
              aria-label="Actualiser les paiements"
              title="Actualiser"
            >
              {/* ⭐ Icon : 15 → 16 */}
              <RefreshCw size={16} strokeWidth={2.2} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}

          {/* Bouton Nouveau paiement */}
          <button
            type="button"
            onClick={onAddPaiement}
            /* ⭐ Button : 13px → 14px */
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 active:scale-[0.98] sm:flex-none"
            aria-label="Nouveau paiement"
          >
            {/* ⭐ Icon : 16 → 17 */}
            <Plus size={17} strokeWidth={2.2} />
            <span>Nouveau paiement</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default PaiementsHeader;