// src/components/mouvements/MouvementsStats.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ DESIGN aligned with KpiCard (dashboard)
// ⭐ LAYOUT: Icon ankavia | Label + Valeur inline
// ⭐ Hover accent top bar + typography madio
// ⭐ FONT SIZE: label 12px uppercase, valeur 20px, icon 20px
// ⭐ HEIGHT: min-h-[95px] compact
// ⭐ PRESERVE: filter functionality (onClick, selected state)

import React from 'react';
import { Loader2, ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface MouvementsStatsProps {
  total: number;
  entrees: number;
  sorties: number;
  ajustements: number;
  quantiteEntree: number;
  quantiteSortie: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  filtreActif?: string;
  onSelectFiltre?: (filtre: string) => void;
}

// ⭐ Palette harmonisée (KpiCard-style)
const STAT_ACCENTS = {
  total: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366F1',
  },
  entrees: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10B981',
  },
  sorties: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accent: '#F59E0B',
  },
  ajustements: {
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    accent: '#EF4444',
  },
};

const MouvementsStats: React.FC<MouvementsStatsProps> = ({
  total, entrees, sorties, ajustements, quantiteEntree, quantiteSortie,
  refreshing: propRefreshing = false, onSelectFiltre, filtreActif = ''
}) => {
  const { isDark } = useTheme();

  const stats = [
    {
      key: '',
      accentKey: 'total' as const,
      label: 'Total Mouvements',
      value: total,
      quantiteValue: null as number | null,
      icon: ArrowLeftRight,
    },
    {
      key: 'ENTREE',
      accentKey: 'entrees' as const,
      label: 'Entrées',
      value: entrees,
      quantiteValue: quantiteEntree,
      icon: ArrowDownToLine,
    },
    {
      key: 'SORTIE',
      accentKey: 'sorties' as const,
      label: 'Sorties',
      value: sorties,
      quantiteValue: quantiteSortie,
      icon: ArrowUpFromLine,
    },
    {
      key: 'AJUSTEMENT',
      accentKey: 'ajustements' as const,
      label: 'Ajustements',
      value: ajustements,
      quantiteValue: null as number | null,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="relative mb-4">
      {/* ⭐ Refreshing badge (top-right) */}
      {propRefreshing && (
        <div className={`absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 shadow-sm animate-pulse ${
          isDark
            ? 'border-white/[0.12] bg-[#0F172A] text-brand-400'
            : 'border-slate-200 bg-white text-brand-600'
        }`}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          <span className="text-[12px] font-semibold uppercase tracking-wider">Mise à jour...</span>
        </div>
      )}

      {/* ⭐ Grid: grid-cols-2 mobile, sm:grid-cols-4 */}
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const accent = STAT_ACCENTS[stat.accentKey];
          const isSelected = filtreActif === stat.key;
          const isFilterCard = stat.key !== '';
          const isActive = isSelected && isFilterCard;

          return (
            <div
              key={stat.key || 'total'}
              onClick={() => isFilterCard && onSelectFiltre?.(stat.key)}
              className={`group relative flex min-h-[95px] flex-col overflow-hidden rounded-xl border-[0.5px] bg-white px-4 py-3 shadow-sm transition-all duration-200 dark:bg-[#0F172A] ${
                isActive
                  ? 'border-brand-500/60 dark:border-brand-500/40 cursor-pointer'
                  : `border-slate-200 dark:border-white/[0.12] ${
                      isFilterCard
                        ? 'cursor-pointer hover:border-brand-500/30 dark:hover:border-brand-500/30'
                        : 'hover:border-brand-500/30 dark:hover:border-brand-500/30'
                    }`
              }`}
            >
              {/* ⭐ Top accent color : visible raha selected, na amin'ny hover */}
              <div
                className={`absolute inset-x-0 top-0 h-[2px] transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ backgroundColor: accent.accent }}
              />

              {/* Header: icon ankavia | label + valeur + quantité */}
              <div className="flex min-w-0 items-start gap-3.5">
                {/* Icon : h-10 w-10 */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconColor} transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>

                {/* Label + Valeur + Quantité */}
                <div className="min-w-0 flex-1">
                  {/* Label : 12px uppercase */}
                  <p className="truncate text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.07em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>

                  {/* Valeur : 20px bold */}
                  <p
                    className="mt-1 truncate text-[20px] font-bold leading-[1.3] tracking-tight text-slate-900 dark:text-slate-100"
                    title={String(stat.value)}
                  >
                    {Number(stat.value || 0).toLocaleString('fr-FR')}
                  </p>

                  {/* Quantité (secondary text) : 11.5px */}
                  {stat.quantiteValue !== null && (
                    <p className="mt-0.5 truncate text-[11.5px] font-medium leading-[1.3] text-slate-400 dark:text-slate-500">
                      {Number(stat.quantiteValue || 0).toLocaleString('fr-FR')} unité{stat.quantiteValue > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MouvementsStats;